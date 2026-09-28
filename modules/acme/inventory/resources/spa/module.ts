import type { FrontendModule } from "@starterkit/module-kit";

const module: FrontendModule = {
  name: "inventory",
  displayName: "Almoxarifado de TI",
  routes: [{ path: "admin/inventory", load: () => import("./pages/InventoryHomePage"), permission: "inventory.dashboard.view" }],
  navigation: [{ to: "/admin/inventory", label: "Almoxarifado", icon: "Boxes", permission: "inventory.dashboard.view", order: 60 }],
};
export default module;
