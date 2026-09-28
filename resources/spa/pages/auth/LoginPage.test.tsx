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
    login: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(authService);

beforeEach(() => {
  mockedAuth.currentUser.mockRejectedValue(
    new ApiError({
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Sessão expirada.",
    }),
  );
});

describe("LoginPage", () => {
  test("autentica e redireciona", async () => {
    const user = userEvent.setup();
    mockedAuth.login.mockResolvedValue({
      id: 1,
      name: "Ana",
      email: "ana@example.com",
      roles: [],
      permissions: [],
    });

    renderWithProviders(<LoginPage />, { withSession: true });

    await user.type(await screen.findByLabelText(/^E-mail/), "ana@example.com");
    await user.type(screen.getByLabelText(/^Senha/), "senha-secreta");
    await user.click(
      screen.getByRole("button", { name: /Entrar na plataforma/ }),
    );

    await waitFor(() =>
      expect(mockedAuth.login).toHaveBeenCalledWith({
        email: "ana@example.com",
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
          fields: { email: ["As credenciais informadas são inválidas."] },
        },
      }),
    );

    renderWithProviders(<LoginPage />, { withSession: true });

    await userEventInstance.type(
      await screen.findByLabelText(/^E-mail/),
      "ana@example.com",
    );
    await userEventInstance.type(screen.getByLabelText(/^Senha/), "errada");
    await userEventInstance.click(
      screen.getByRole("button", { name: /Entrar na plataforma/ }),
    );

    expect(
      await screen.findByText("As credenciais informadas são inválidas."),
    ).toBeInTheDocument();
  });
});
