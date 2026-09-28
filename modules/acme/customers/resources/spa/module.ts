import type { FrontendModule } from "@starterkit/module-kit";

const module: FrontendModule = {
  name: "customers",
  displayName: "Clientes",
  routes: [
    {
      path: "admin/customers",
      load: () => import("./pages/CustomersPage"),
      permission: "customers.viewAny",
    },
    {
      path: "admin/customers/new",
      load: () => import("./pages/CustomerCreatePage"),
      permission: "customers.create",
    },
    {
      path: "admin/customers/:id",
      load: () => import("./pages/CustomerEditPage"),
      permissionsAll: ["customers.view", "customers.update"],
    },
  ],
  navigation: [
    {
      to: "/admin/customers",
      label: "Clientes",
      icon: "Users",
      permission: "customers.viewAny",
      order: 50,
    },
  ],
};

export default module;
