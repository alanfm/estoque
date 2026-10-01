import { describe, expect, it } from "vitest";
import fixtureModule from "../../../tests/Fixtures/Modules/Starterkit/ContractSample/resources/spa/module";
import { createModuleRegistry, createModuleRoutes } from "./registry";
import type { ModuleEntry } from "./types";

const fixtureEntry: ModuleEntry = {
  name: "contract-sample",
  load: async () => ({ default: fixtureModule }),
};

describe("createModuleRegistry", () => {
  it("registers routes, navigation and module metadata", async () => {
    const registry = await createModuleRegistry([fixtureEntry]);

    expect(registry.issues).toEqual([]);
    expect(registry.modules).toEqual([
      { name: "contract-sample", displayName: "Amostra de Contrato" },
    ]);
    expect(registry.routes.map((route) => route.path)).toEqual([
      "admin/contract-sample",
    ]);
    expect(registry.navigation).toEqual([
      expect.objectContaining({
        to: "/admin/contract-sample",
        permission: "contract-sample.viewAny",
      }),
    ]);
    expect(registry.navigationGroups).toEqual([]);
  });

  it("groups and orders module navigation when a navigation group is declared", async () => {
    const groupedModule = {
      ...fixtureModule,
      navigationGroup: { icon: "Package", order: 20 },
      navigation: [
        { to: "/admin/contract-sample/new", label: "Novo", order: 2 },
        { to: "/admin/contract-sample", label: "Lista", order: 1 },
      ],
    };
    const registry = await createModuleRegistry([
      {
        name: "contract-sample",
        load: async () => ({ default: groupedModule }),
      },
    ]);

    expect(registry.navigationGroups).toEqual([
      {
        moduleName: "contract-sample",
        label: "Amostra de Contrato",
        icon: "Package",
        order: 20,
        registrationOrder: 0,
        items: [
          { to: "/admin/contract-sample", label: "Lista", order: 1 },
          { to: "/admin/contract-sample/new", label: "Novo", order: 2 },
        ],
      },
    ]);
    expect(registry.navigation.map((item) => item.label)).toEqual([
      "Lista",
      "Novo",
    ]);
  });

  it("compiles the module page through the host bundler", async () => {
    const route = fixtureModule.routes?.[0];

    expect(route).toBeDefined();

    const page = await route?.load();

    expect(page?.default).toBeTypeOf("function");
  });

  it("isolates duplicate identifiers", async () => {
    const registry = await createModuleRegistry([
      fixtureEntry,
      { name: "contract-sample", load: fixtureEntry.load },
    ]);

    expect(registry.issues).toHaveLength(1);
    expect(registry.issues[0]).toContain("duplicado");
  });

  it("isolates modules that fail to load", async () => {
    const registry = await createModuleRegistry([
      {
        name: "broken",
        load: async () => {
          throw new Error("falha simulada");
        },
      },
      fixtureEntry,
    ]);

    expect(registry.issues[0]).toContain("Falha ao carregar");
    expect(registry.modules.map((module) => module.name)).toEqual([
      "contract-sample",
    ]);
  });

  it("wraps module routes with permission guards", () => {
    const [route] = createModuleRoutes(fixtureModule.routes ?? []);

    expect(route?.path).toBe("admin/contract-sample");
    expect(route?.element).toBeTruthy();
  });
});
