import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModulesProvider } from "../modules/ModulesContext";
import { createModuleRegistry } from "../modules/registry";
import { authService } from "../services/auth/authService";
import { renderWithProviders } from "../test/renderWithProviders";
import { DashboardPage } from "./DashboardPage";

vi.mock("../services/auth/authService", () => ({
  authService: { currentUser: vi.fn() },
}));

async function renderDashboard(permissions: string[], roles: string[] = []) {
  vi.mocked(authService.currentUser).mockResolvedValue({
    id: 1,
    name: "Pessoa",
    email: "pessoa@example.test",
    roles,
    permissions,
    isSuperAdmin: roles.includes("super-admin"),
  });
  const registry = await createModuleRegistry([
    {
      name: "customers",
      load: async () => ({
        default: {
          name: "customers",
          displayName: "Clientes",
          navigation: [
            {
              to: "/customers",
              label: "Listar clientes",
              permission: "customers.viewAny",
            },
          ],
          register(context) {
            context.registerNavigation([
              {
                to: "/reports",
                label: "Relatórios",
                permission: "customers.reports",
              },
            ]);
          },
        },
      }),
    },
    {
      name: "restricted",
      load: async () => ({
        default: {
          name: "restricted",
          displayName: "Restrito",
          navigationGroup: {},
          navigation: [{ to: "/restricted", label: "Abrir restrito" }],
          routes: [
            {
              path: "restricted",
              load: async () => ({ default: () => null }),
              permissionsAny: ["restricted.view"],
              permissionsAll: ["restricted.extra"],
            },
          ],
        },
      }),
    },
  ]);
  renderWithProviders(
    <ModulesProvider registry={registry}>
      <DashboardPage />
    </ModulesProvider>,
  );
  await screen.findByText("Olá, Pessoa");
}

describe("DashboardPage", () => {
  it("gera cards de módulos legados e filtra links registrados pelo callback", async () => {
    await renderDashboard(["customers.reports"]);
    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Relatórios" })).toHaveAttribute(
      "href",
      "/reports",
    );
    expect(
      screen.queryByRole("link", { name: "Listar clientes" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Restrito")).not.toBeInTheDocument();
  });

  it("oculta módulos sem acesso para usuários comuns", async () => {
    await renderDashboard([], ["admin"]);
    expect(screen.queryByText("Clientes")).not.toBeInTheDocument();
    expect(screen.queryByText("Restrito")).not.toBeInTheDocument();
  });

  it("exibe todos os módulos e links para super-admin sem permissões explícitas", async () => {
    await renderDashboard([], ["super-admin"]);
    for (const name of [
      "Listar clientes",
      "Relatórios",
      "Abrir restrito",
      "Gerenciar usuários",
      "Gerenciar papéis",
    ]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("exige todas as condições da rota mesmo quando o link não declara permissão", async () => {
    await renderDashboard(["restricted.view"]);
    expect(screen.queryByText("Restrito")).not.toBeInTheDocument();
  });

  it("mostra o módulo autorizado e mantém os atalhos administrativos", async () => {
    await renderDashboard([
      "restricted.view",
      "restricted.extra",
      "users.viewAny",
    ]);
    expect(
      screen.getByRole("link", { name: "Abrir restrito" }),
    ).toHaveAttribute("href", "/restricted");
    expect(
      screen.getByRole("link", { name: "Gerenciar usuários" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Gerenciar papéis" }),
    ).not.toBeInTheDocument();
  });
});
