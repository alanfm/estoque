import { describe, expect, test } from "vitest";
import inventory from "../../../modules/acme/inventory/resources/spa/module";
import type { SessionUser } from "../types/auth";
import { visibleDashboardModules } from "./dashboard";
import { createModuleRegistry } from "./registry";

const user: SessionUser = {
  id: 1,
  name: "Técnico",
  email: "tecnico@example.test",
  roles: [],
  permissions: ["inventory.items.viewAny"],
  isSuperAdmin: false,
};

describe("integração do inventário com o painel do core", () => {
  test("projeta o manifesto real e limita os atalhos às permissões da sessão", async () => {
    const registry = await createModuleRegistry([
      { name: "inventory", load: async () => ({ default: inventory }) },
    ]);
    const modules = visibleDashboardModules(registry.modules, user);
    expect(modules).toHaveLength(1);
    expect(modules[0].name).toBe("inventory");
    expect(modules[0].icon).toBe("Boxes");
    expect(modules[0].navigation.map((item) => item.to)).toEqual([
      "/admin/inventory",
    ]);
    expect(
      visibleDashboardModules(registry.modules, { ...user, permissions: [] }),
    ).toEqual([]);
    expect(
      visibleDashboardModules(registry.modules, {
        ...user,
        permissions: [],
        isSuperAdmin: true,
      })[0].navigation,
    ).toHaveLength(inventory.navigation!.length);
  });
});
