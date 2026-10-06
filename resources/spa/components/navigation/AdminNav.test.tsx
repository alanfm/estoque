import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ModulesProvider } from "../../modules/ModulesContext";
import type { FrontendModuleRegistry } from "../../modules/types";
import type { SessionUser } from "../../types/auth";
import { AdminNav } from "./AdminNav";

const user = (permissions: string[]): SessionUser => ({
  id: 1,
  name: "Teste",
  email: "teste@example.test",
  roles: [],
  permissions,
  isSuperAdmin: false,
});

const registry: FrontendModuleRegistry = {
  modules: [],
  routes: [],
  issues: [],
  navigation: [
    {
      to: "/admin/customers",
      label: "Listar clientes",
      permission: "customers.viewAny",
    },
    {
      to: "/admin/customers/new",
      label: "Novo cliente",
      permission: "customers.create",
      end: true,
    },
    { to: "/admin/legacy", label: "Legado" },
    { to: "/admin/secret", label: "Segredo", permission: "secret.view" },
  ],
  navigationGroups: [
    {
      moduleName: "customers",
      label: "Clientes",
      icon: "Users",
      order: 100,
      registrationOrder: 0,
      items: [
        {
          to: "/admin/customers",
          label: "Listar clientes",
          permission: "customers.viewAny",
        },
        {
          to: "/admin/customers/new",
          label: "Novo cliente",
          permission: "customers.create",
          end: true,
        },
      ],
    },
    {
      moduleName: "secret",
      label: "Privado",
      order: 100,
      registrationOrder: 1,
      items: [
        { to: "/admin/secret", label: "Segredo", permission: "secret.view" },
      ],
    },
  ],
};

function renderNav({
  pathname = "/admin/customers",
  permissions = ["customers.viewAny", "customers.create"],
  collapsed = false,
  expanded = new Set<string>(),
  onToggleGroup = vi.fn(),
  onExpandSidebar = vi.fn(),
  instance = "desktop",
}: {
  pathname?: string;
  permissions?: string[];
  collapsed?: boolean;
  expanded?: Set<string>;
  onToggleGroup?: (moduleName: string) => void;
  onExpandSidebar?: (moduleName: string) => void;
  instance?: string;
} = {}) {
  return render(
    <ModulesProvider registry={registry}>
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route
            path="*"
            element={
              <AdminNav
                user={user(permissions)}
                collapsed={collapsed}
                instance={instance}
                expandedGroups={expanded}
                onToggleGroup={onToggleGroup}
                onExpandSidebar={onExpandSidebar}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </ModulesProvider>,
  );
}

describe("AdminNav", () => {
  it("groups core access pages and opens the group on nested routes", () => {
    const onToggleGroup = vi.fn();
    renderNav({
      pathname: "/admin/users/1",
      permissions: ["users.viewAny", "roles.viewAny"],
      expanded: new Set(["core/access"]),
      onToggleGroup,
    });

    const parent = screen.getByRole("button", { name: "Acesso" });
    const children = document.getElementById(
      parent.getAttribute("aria-controls")!,
    );
    expect(children).toContainElement(
      screen.getByRole("link", { name: "Usuários" }),
    );
    expect(children).toContainElement(
      screen.getByRole("link", { name: "Papéis" }),
    );
    expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("filters access children by permission and opens their active group", () => {
    const onToggleGroup = vi.fn();
    renderNav({
      pathname: "/admin/roles/new",
      permissions: ["roles.viewAny"],
      expanded: new Set(["core/access"]),
    });
    expect(screen.getByRole("button", { name: "Acesso" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Papéis" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Usuários" }),
    ).not.toBeInTheDocument();

    renderNav({
      pathname: "/admin/roles/new",
      permissions: ["roles.viewAny"],
      onToggleGroup,
    });
    expect(onToggleGroup).toHaveBeenCalledWith("core/access");
  });

  it("hides the access group when neither core page is authorized", () => {
    renderNav({ permissions: [] });
    expect(
      screen.queryByRole("button", { name: "Acesso" }),
    ).not.toBeInTheDocument();
  });

  it("toggles a group without navigation and marks only the active child", async () => {
    const userActions = userEvent.setup();
    const onToggleGroup = vi.fn();
    renderNav({ expanded: new Set(["customers"]), onToggleGroup });

    const parent = screen.getByRole("button", { name: "Clientes" });
    expect(parent).toHaveAttribute("aria-expanded", "true");
    await userActions.click(parent);
    expect(onToggleGroup).toHaveBeenCalledWith("customers");
    expect(parent).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getAllByRole("link", { name: "Listar clientes" })[1],
    ).toHaveAttribute("aria-current", "page");
  });

  it("opens the active group on direct route", () => {
    const onToggleGroup = vi.fn();
    renderNav({ pathname: "/admin/customers/new", onToggleGroup });

    expect(onToggleGroup).toHaveBeenCalledWith("customers");
  });

  it("hides unauthorized children and groups without visible children", () => {
    renderNav({ permissions: ["customers.create"] });

    expect(
      screen.getByRole("button", { name: "Clientes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Privado" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Segredo" }),
    ).not.toBeInTheDocument();
  });

  it("keeps flat navigation links available alongside groups", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Legado" })).toBeInTheDocument();
  });

  it("expands the collapsed sidebar through the parent callback", async () => {
    const userActions = userEvent.setup();
    const onExpandSidebar = vi.fn();
    const onToggleGroup = vi.fn();
    renderNav({ collapsed: true, onExpandSidebar, onToggleGroup });
    await userActions.click(screen.getByRole("button", { name: "Clientes" }));

    expect(onExpandSidebar).toHaveBeenCalledWith("customers");
    expect(onToggleGroup).toHaveBeenCalledWith("customers");
  });

  it("generates distinct controlled-list IDs for desktop and mobile instances", () => {
    const { container } = render(
      <ModulesProvider registry={registry}>
        <MemoryRouter initialEntries={["/admin/customers"]}>
          <div>
            <AdminNav user={user([])} instance="desktop" />
            <AdminNav user={user([])} instance="mobile" />
          </div>
        </MemoryRouter>
      </ModulesProvider>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns focus to the parent before collapsing focused children", async () => {
    const userActions = userEvent.setup();
    const onToggleGroup = vi.fn();
    renderNav({ expanded: new Set(["customers"]), onToggleGroup });
    const parent = screen.getByRole("button", { name: "Clientes" });
    const child = screen.getAllByRole("link", { name: "Listar clientes" })[1];
    expect(child).toBeDefined();
    child?.focus();
    const controlled = document.getElementById("module-nav-desktop-customers");
    expect(controlled).toContainElement(child);
    await userActions.click(parent);

    expect(parent).toHaveFocus();
    expect(onToggleGroup).toHaveBeenCalledWith("customers");
    expect(
      screen.getAllByRole("link", { name: "Listar clientes" }),
    ).toHaveLength(2);
  });

  it("exposes the imperative focus operation for collapsed-sidebar restoration", () => {
    const imperativeRef = createRef<{
      expandGroup(moduleName: string): void;
    }>();
    const { rerender } = render(
      <ModulesProvider registry={registry}>
        <MemoryRouter initialEntries={["/admin/customers"]}>
          <AdminNav
            user={user(["customers.viewAny"])}
            collapsed
            imperativeRef={imperativeRef}
          />
        </MemoryRouter>
      </ModulesProvider>,
    );

    rerender(
      <ModulesProvider registry={registry}>
        <MemoryRouter initialEntries={["/admin/customers"]}>
          <AdminNav
            user={user(["customers.viewAny"])}
            imperativeRef={imperativeRef}
          />
        </MemoryRouter>
      </ModulesProvider>,
    );
    act(() => imperativeRef.current?.expandGroup("customers"));
    expect(screen.getByRole("button", { name: "Clientes" })).toHaveFocus();
  });
});

it("exibe Configurações e Módulos conforme a permissão do núcleo", () => {
  renderNav({
    pathname: "/admin/modules",
    permissions: ["modules.viewAny"],
    expanded: new Set(["core/settings"]),
  });
  expect(screen.getByRole("button", { name: "Configurações" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(screen.getByRole("link", { name: "Módulos" })).toHaveAttribute(
    "href",
    "/admin/modules",
  );
});
