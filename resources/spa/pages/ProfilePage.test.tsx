import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { authService } from "../services/auth/authService";
import { ApiError } from "../services/api/errors";
import type { SessionUser } from "../types/auth";
import { ProfilePage } from "./ProfilePage";

vi.mock("../services/auth/authService", () => ({
  authService: { currentUser: vi.fn(), syncProfile: vi.fn() },
}));
const auth = vi.mocked(authService);
const user: SessionUser = {
  id: 1,
  name: "Pessoa LDAP",
  email: "pessoa@example.test",
  registry: "0012345",
  accountSource: "ldap",
  roles: [],
  permissions: [],
  isSuperAdmin: false,
  authentication: { provider: "ldap", canChangeLocalPassword: false },
};

describe("ProfilePage", () => {
  test("permite sincronização sem permissões e reflete o perfil atualizado sem armazenar senha", async () => {
    auth.currentUser.mockResolvedValue(user);
    auth.syncProfile.mockResolvedValue({ ...user, name: "Nome atualizado" });
    const actor = userEvent.setup();
    renderWithProviders(<ProfilePage />, { route: "/profile" });
    expect(await screen.findByText("Pessoa LDAP")).toBeInTheDocument();
    await actor.type(
      screen.getByLabelText(/^Senha institucional/),
      "institutional-secret",
    );
    await actor.click(
      screen.getByRole("button", { name: "Sincronizar com LDAP" }),
    );
    expect(
      await screen.findByText("Perfil sincronizado com sucesso."),
    ).toBeInTheDocument();
    expect(screen.getByText("Nome atualizado")).toBeInTheDocument();
    expect(auth.syncProfile).toHaveBeenCalledWith("institutional-secret");
    expect(screen.getByLabelText(/^Senha institucional/)).toHaveValue("");
  });

  test("conserva dados em falha e limpa senha institucional", async () => {
    auth.currentUser.mockResolvedValue(user);
    auth.syncProfile.mockRejectedValue(
      new ApiError({
        status: 503,
        code: "AUTH_PROVIDER_UNAVAILABLE",
        message: "Diretório indisponível.",
      }),
    );
    const actor = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByText("Pessoa LDAP");
    await actor.type(
      screen.getByLabelText(/^Senha institucional/),
      "institutional-secret",
    );
    await actor.click(
      screen.getByRole("button", { name: "Sincronizar com LDAP" }),
    );
    expect(
      await screen.findByText("Diretório indisponível."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pessoa LDAP")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha institucional/)).toHaveValue("");
  });

  test("conta local não oferece sincronização institucional", async () => {
    auth.currentUser.mockResolvedValue({ ...user, accountSource: "local" });
    renderWithProviders(<ProfilePage />);
    await waitFor(() =>
      expect(screen.getByText("Pessoa LDAP")).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: "Sincronizar com LDAP" }),
    ).not.toBeInTheDocument();
  });
});
