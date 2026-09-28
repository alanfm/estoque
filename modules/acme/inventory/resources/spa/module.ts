import type { FrontendModule } from "@starterkit/module-kit";

const module: FrontendModule = {
  name: "inventory",
  displayName: "Almoxarifado de TI",
  routes: [
    { path: "admin/inventory", load: () => import("./pages/ItemsPage"), permission: "inventory.items.viewAny" },
    { path: "admin/inventory/new", load: () => import("./pages/ItemCreatePage"), permission: "inventory.items.create" },
    { path: "admin/inventory/categories", load: () => import("./pages/CategoriesPage"), permission: "inventory.categories.viewAny" },
    { path: "admin/inventory/:id", load: () => import("./pages/ItemDetailPage"), permission: "inventory.items.view" },
  ],
  navigation: [
    { to: "/admin/inventory", label: "Almoxarifado", icon: "Boxes", permission: "inventory.items.viewAny", order: 60 },
    { to: "/admin/inventory/categories", label: "Categorias", icon: "Tags", permission: "inventory.categories.viewAny", order: 61 },
  ],
};
export default module;
