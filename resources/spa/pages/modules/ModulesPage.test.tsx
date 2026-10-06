import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { authService } from "../../services/auth/authService";
import { ApiError } from "../../services/api/errors";
import { modulesService } from "../../services/modules/modulesService";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ModulesPage } from "./ModulesPage";

vi.mock("../../services/auth/authService", () => ({
  authService: { currentUser: vi.fn() },
}));
vi.mock("../../services/modules/modulesService", () => ({
  modulesService: {
    list: vi.fn(),
    install: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    remove: vi.fn(),
  },
}));
const response = {
  data: [
    {
      name: "customers",
      displayName: "Clientes",
      version: "1.0.0",
      core: "^1.0",
      enabled: true,
      issues: [],
      dependencies: [],
    },
  ],
  meta: { coreVersion: "1.1.0", managementEnabled: true, issues: [] },
};
beforeEach(() => {
  vi.mocked(authService.currentUser).mockResolvedValue({
    id: 1,
    name: "Admin",
    email: "admin@example.test",
    roles: ["super-admin"],
    isSuperAdmin: true,
    permissions: [],
  });
  vi.mocked(modulesService.list).mockResolvedValue(response);
  vi.mocked(modulesService.install).mockResolvedValue();
  vi.mocked(modulesService.remove).mockResolvedValue();
});
it("solicita link GitHub e mostra incompatibilidade retornada pelo servidor", async () => {
  vi.mocked(modulesService.install).mockRejectedValue(
    new ApiError({
      status: 422,
      code: "VALIDATION_FAILED",
      message: "Inválido",
      details: {
        fields: { repository: ["Núcleo incompatível: requer ^2.0."] },
      },
    }),
  );
  renderWithProviders(<ModulesPage />);
  await screen.findByText("Clientes");
  await userEvent.click(
    screen.getByRole("button", { name: "Adicionar módulo" }),
  );
  await userEvent.type(
    screen.getByLabelText("Link do módulo (GitHub)"),
    "https://github.com/acme/example",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Verificar e instalar" }),
  );
  expect(
    await screen.findByText("Núcleo incompatível: requer ^2.0."),
  ).toBeInTheDocument();
  expect(modulesService.install).toHaveBeenCalledWith(
    "https://github.com/acme/example",
  );
});
it("confirma remoção e atualiza a listagem", async () => {
  renderWithProviders(<ModulesPage />);
  await screen.findByText("Clientes");
  await userEvent.click(screen.getByRole("button", { name: "Remover" }));
  expect(modulesService.remove).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  await waitFor(() =>
    expect(modulesService.remove).toHaveBeenCalledWith("customers"),
  );
  expect(await screen.findByText(/Operação concluída/)).toBeInTheDocument();
});
it("oculta controles sem permissões de operação", async () => {
  vi.mocked(authService.currentUser).mockResolvedValue({
    id: 2,
    name: "Leitor",
    email: "leitor@example.test",
    roles: [],
    isSuperAdmin: false,
    permissions: ["modules.viewAny"],
  });
  renderWithProviders(<ModulesPage />);
  await screen.findByText("Clientes");
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Adicionar módulo" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByRole("button", { name: "Remover" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Desabilitar" }),
  ).not.toBeInTheDocument();
});
