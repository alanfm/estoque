import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ApiError } from "../../services/api/errors";
import { authService } from "../../services/auth/authService";
import { LoginPage } from "./LoginPage";

vi.mock("../../services/auth/authService", () => ({
  authService: {
    currentUser: vi.fn(),
    options: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(authService);

beforeEach(() => {
  mockedAuth.options.mockResolvedValue({
    localEnabled: true,
    ldapEnabled: false,
    ldapLabel: "Conta institucional IFCE",
    ldapPasswordHelpUrl: null,
  });
  mockedAuth.currentUser.mockRejectedValue(
    new ApiError({
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Sessão expirada.",
    }),
  );
});

describe("LoginPage", () => {
  test("ignora o cancelamento esperado ao desmontar o efeito de opções", async () => {
    mockedAuth.options.mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    renderWithProviders(<LoginPage />);

    await waitFor(() => expect(mockedAuth.options).toHaveBeenCalled());
    expect(
      screen.queryByText(
        "Não foi possível carregar as opções de acesso. Tente novamente.",
      ),
    ).not.toBeInTheDocument();
  });

  test("autentica e redireciona", async () => {
    const user = userEvent.setup();
    mockedAuth.login.mockResolvedValue({
      id: 1,
      name: "Ana",
      email: "ana@example.com",
      roles: [],
      permissions: [],
      isSuperAdmin: false,
    });

    renderWithProviders(<LoginPage />, { withSession: true });

    await user.type(await screen.findByLabelText(/^Matrícula/), "ana001");
    await user.type(screen.getByLabelText(/^Senha/), "senha-secreta");
    await user.click(
      screen.getByRole("button", { name: /Entrar na plataforma/ }),
    );

    await waitFor(() =>
      expect(mockedAuth.login).toHaveBeenCalledWith({
        provider: "auto",
        registry: "ana001",
        password: "senha-secreta",
      }),
    );
  });

  test("mostra credenciais inválidas sem enumerar contas", async () => {
    const userEventInstance = userEvent.setup();
    mockedAuth.login.mockRejectedValue(
      new ApiError({
        status: 422,
        code: "VALIDATION_FAILED",
        message: "As credenciais informadas são inválidas.",
        details: {
          fields: { registry: ["As credenciais informadas são inválidas."] },
        },
      }),
    );

    renderWithProviders(<LoginPage />, { withSession: true });

    await userEventInstance.type(
      await screen.findByLabelText(/^Matrícula/),
      "ana001",
    );
    await userEventInstance.type(screen.getByLabelText(/^Senha/), "errada");
    await userEventInstance.click(
      screen.getByRole("button", { name: /Entrar na plataforma/ }),
    );

    expect(
      await screen.findByText("As credenciais informadas são inválidas."),
    ).toBeInTheDocument();
  });

  test("limpa a senha em indisponibilidade LDAP e mantém a matrícula", async () => {
    const user = userEvent.setup();
    mockedAuth.options.mockResolvedValue({
      localEnabled: true,
      ldapEnabled: true,
      ldapLabel: "Conta institucional IFCE",
      ldapPasswordHelpUrl: null,
    });
    mockedAuth.login.mockRejectedValue(
      new ApiError({
        status: 503,
        code: "AUTH_PROVIDER_UNAVAILABLE",
        message: "O serviço institucional está temporariamente indisponível.",
      }),
    );

    renderWithProviders(<LoginPage />, { withSession: true });
    await user.type(await screen.findByLabelText(/Matrícula/), "0012345");
    const password = screen.getByLabelText(/^Senha/);
    await user.type(password, "senha-institucional");
    await user.click(
      screen.getByRole("button", { name: /Entrar na plataforma/ }),
    );

    await waitFor(() => expect(password).toHaveValue(""));
    expect(screen.getByLabelText(/Matrícula/)).toHaveValue("0012345");
    expect(
      await screen.findByText(/temporariamente indisponível/),
    ).toBeInTheDocument();
  });
});
