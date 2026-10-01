import { describe, expect, it } from "vitest";
import { deriveModuleNavigation } from "./moduleNavigation";
import type { RegisteredModuleNavigationGroup } from "../../modules/types";
import type { SessionUser } from "../../types/auth";

const user = (permissions: string[]): SessionUser =>
  ({ permissions, isSuperAdmin: false }) as SessionUser;

const group = (
  items: RegisteredModuleNavigationGroup["items"],
): RegisteredModuleNavigationGroup => ({
  moduleName: "customers",
  label: "Clientes",
  order: 100,
  registrationOrder: 0,
  items,
});

describe("deriveModuleNavigation", () => {
  it("filters permissions and omits groups without visible children", () => {
    const groups = [
      group([
        {
          to: "/admin/customers",
          label: "Listagem",
          permission: "customers.viewAny",
        },
        {
          to: "/admin/customers/new",
          label: "Novo",
          permission: "customers.create",
        },
      ]),
      {
        ...group([
          { to: "/admin/secret", label: "Segredo", permission: "secret.view" },
        ]),
        moduleName: "secret",
      },
    ];
    const navigation = groups.flatMap((entry) => entry.items);

    expect(
      deriveModuleNavigation({
        navigation,
        navigationGroups: groups,
        user: user(["customers.create"]),
        pathname: "/admin/customers/new",
      }).groups.map((entry) => entry.items.map((item) => item.label)),
    ).toEqual([["Novo"]]);
    expect(
      deriveModuleNavigation({
        navigation,
        navigationGroups: groups,
        user: user([]),
        pathname: "/admin/customers",
      }).groups,
    ).toEqual([]);
  });

  it("selects the most specific route, ignoring query and fragment", () => {
    const entry = group([
      { to: "/admin/customers", label: "Listagem" },
      { to: "/admin/customers/new", label: "Novo", end: true },
    ]);
    const result = deriveModuleNavigation({
      navigation: entry.items,
      navigationGroups: [entry],
      user: user([]),
      pathname: "/admin/customers/new/?from=list#form",
    });

    expect(result.groups[0]?.activeItem?.label).toBe("Novo");
    expect(result.groups[0]?.items.filter((item) => item.active)).toHaveLength(
      1,
    );
  });

  it("keeps edit routes in the list context without matching a sibling prefix", () => {
    const entry = group([{ to: "/admin/customers", label: "Listagem" }]);
    const result = deriveModuleNavigation({
      navigation: entry.items,
      navigationGroups: [entry],
      user: user([]),
      pathname: "/admin/customers/42",
    });
    const sibling = deriveModuleNavigation({
      navigation: entry.items,
      navigationGroups: [entry],
      user: user([]),
      pathname: "/admin/customers-old",
    });

    expect(result.groups[0]?.activeItem?.label).toBe("Listagem");
    expect(sibling.groups[0]?.activeItem).toBeUndefined();
  });

  it("keeps flat module links separate from grouped items", () => {
    const entry = group([{ to: "/admin/grouped", label: "Agrupado" }]);
    const result = deriveModuleNavigation({
      navigation: [...entry.items, { to: "/admin/legacy", label: "Legado" }],
      navigationGroups: [entry],
      user: user([]),
      pathname: "/admin/legacy",
    });

    expect(result.standaloneItems.map((item) => item.label)).toEqual([
      "Legado",
    ]);
    expect(result.standaloneItems[0]?.active).toBe(true);
  });

  it("shows every grouped and standalone item to the superadministrator", () => {
    const grouped = group([
      {
        to: "/admin/customers",
        label: "Listagem",
        permission: "customers.viewAny",
      },
    ]);
    const result = deriveModuleNavigation({
      navigation: [
        ...grouped.items,
        {
          to: "/admin/legacy",
          label: "Legado",
          permission: "unknown.permission",
        },
      ],
      navigationGroups: [grouped],
      user: { ...user([]), isSuperAdmin: true },
      pathname: "/admin/legacy",
    });

    expect(result.groups[0]?.items.map((item) => item.label)).toEqual([
      "Listagem",
    ]);
    expect(result.standaloneItems.map((item) => item.label)).toEqual([
      "Legado",
    ]);
  });
});
