import type { FrontendModule } from "@starterkit/module-kit";

const module: FrontendModule = {
  name: "inventory",
  displayName: "Almoxarifado de TI",
  routes: [
    {
      path: "admin/inventory",
      load: () => import("./pages/ItemsPage"),
      permission: "inventory.items.viewAny",
    },
    {
      path: "admin/inventory/new",
      load: () => import("./pages/ItemCreatePage"),
      permission: "inventory.items.create",
    },
    {
      path: "admin/inventory/categories",
      load: () => import("./pages/CategoriesPage"),
      permission: "inventory.categories.viewAny",
    },
    {
      path: "admin/inventory/:id",
      load: () => import("./pages/ItemDetailPage"),
      permission: "inventory.items.view",
    },
    {
      path: "admin/inventory/movements",
      load: () => import("./pages/MovementsPage"),
      permission: "inventory.movements.viewAny",
    },
    {
      path: "admin/inventory/movements/entry",
      load: () =>
        import("./pages/MovementCreatePage").then((page) => ({
          default: page.EntryCreatePage,
        })),
      permission: "inventory.entries.create",
    },
    {
      path: "admin/inventory/movements/issue",
      load: () =>
        import("./pages/MovementCreatePage").then((page) => ({
          default: page.IssueCreatePage,
        })),
      permission: "inventory.issues.create",
    },
    {
      path: "admin/inventory/movements/:id",
      load: () => import("./pages/MovementDetailPage"),
      permission: "inventory.movements.view",
    },
  ],
  navigation: [
    {
      to: "/admin/inventory",
      label: "Almoxarifado",
      icon: "Boxes",
      permission: "inventory.items.viewAny",
      order: 60,
    },
    {
      to: "/admin/inventory/categories",
      label: "Categorias",
      icon: "Tags",
      permission: "inventory.categories.viewAny",
      order: 61,
    },
    {
      to: "/admin/inventory/movements",
      label: "Movimentações",
      icon: "ArrowLeftRight",
      permission: "inventory.movements.viewAny",
      order: 62,
    },
  ],
};
export default module;
