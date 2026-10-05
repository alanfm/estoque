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

  it("groups declared and callback navigation without mutating module items", async () => {
    const declared = { to: "/admin/grouped", label: "Visão geral", order: 20 };
    const registered = {
      to: "/admin/grouped/reports",
      label: "Relatórios",
      order: 10,
    };
    const registry = await createModuleRegistry([
      {
        name: "grouped",
        load: async () => ({
          default: {
            name: "grouped",
            displayName: "Agrupado",
            navigationGroup: { icon: "Package", order: 5 },
            navigation: [declared],
            register(context) {
              context.registerNavigation([registered]);
            },
          },
        }),
      },
    ]);

    expect(registry.navigationGroups).toEqual([
      {
        moduleName: "grouped",
        label: "Agrupado",
        icon: "Package",
        order: 5,
        registrationOrder: 0,
        items: [registered, declared],
      },
    ]);
    expect(registry.navigation).toEqual([registered, declared]);
    expect(declared.order).toBe(20);
  });

  it("sorts groups stably and leaves groups with no navigation out", async () => {
    const registry = await createModuleRegistry([
      {
        name: "later",
        load: async () => ({
          default: {
            name: "later",
            navigationGroup: { order: 20 },
            navigation: [],
          },
        }),
      },
      {
        name: "first",
        load: async () => ({
          default: {
            name: "first",
            navigationGroup: { order: 10 },
            navigation: [],
          },
        }),
      },
      {
        name: "same-order",
        load: async () => ({
          default: {
            name: "same-order",
            navigationGroup: { order: 10 },
            navigation: [],
          },
        }),
      },
    ]);

    expect(registry.navigationGroups.map((group) => group.moduleName)).toEqual([
      "first",
      "same-order",
      "later",
    ]);
  });

  it("does not publish partial module contributions when registration fails", async () => {
    const registry = await createModuleRegistry([
      {
        name: "broken-registration",
        load: async () => ({
          default: {
            name: "broken-registration",
            navigationGroup: {},
            routes: [
              {
                path: "admin/broken",
                load: async () => ({ default: () => null }),
              },
            ],
            navigation: [{ to: "/admin/broken", label: "Parcial" }],
            register() {
              throw new Error("falha simulada no registro");
            },
          },
        }),
      },
      fixtureEntry,
    ]);

    expect(registry.issues[0]).toContain("Falha ao registrar");
    expect(registry.modules.map((module) => module.name)).toEqual([
      "contract-sample",
    ]);
    expect(registry.routes.map((route) => route.path)).toEqual([
      "admin/contract-sample",
    ]);
    expect(registry.navigationGroups).toEqual([]);
    expect(registry.navigation.map((item) => item.to)).toEqual([
      "/admin/contract-sample",
    ]);
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
