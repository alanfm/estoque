import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { authService } from "../../services/auth/authService";
import { ResetPasswordPage } from "./ResetPasswordPage";

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

describe("ResetPasswordPage", () => {
  test("informa link inválido sem token", () => {
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password",
      withSession: false,
    });

    expect(screen.getByText("Link inválido")).toBeInTheDocument();
  });

  test("valida confirmação divergente", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password?token=abc&email=ana%40example.com",
      withSession: false,
    });

    await user.type(
      screen.getByLabelText(/^Nova senha/),
      "uma-senha-bem-longa",
    );
    await user.type(
      screen.getByLabelText(/Confirmar nova senha/),
      "outra-senha-bem-longa",
    );
    await user.click(screen.getByRole("button", { name: "Definir senha" }));

    expect(
      await screen.findByText("As senhas não coincidem."),
    ).toBeInTheDocument();
    expect(vi.mocked(authService.resetPassword)).not.toHaveBeenCalled();
  });

  test("define a senha e confirma", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.resetPassword).mockResolvedValue();

    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password?token=abc&email=ana%40example.com",
      withSession: false,
    });

    await user.type(
      screen.getByLabelText(/^Nova senha/),
      "uma-senha-bem-longa",
    );
    await user.type(
      screen.getByLabelText(/Confirmar nova senha/),
      "uma-senha-bem-longa",
    );
    await user.click(screen.getByRole("button", { name: "Definir senha" }));

    expect(await screen.findByText("Senha definida")).toBeInTheDocument();
    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: "ana@example.com",
      token: "abc",
      password: "uma-senha-bem-longa",
      passwordConfirmation: "uma-senha-bem-longa",
    });
  });
});
