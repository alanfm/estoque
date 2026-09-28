import type { FrontendModule } from "@starterkit/module-kit";

const module: FrontendModule = {
  name: "contract-sample",
  displayName: "Amostra de Contrato",
  routes: [
    {
      path: "admin/contract-sample",
      load: () => import("./pages/ContractSamplePage"),
      permission: "contract-sample.viewAny",
    },
  ],
  navigation: [
    {
      to: "/admin/contract-sample",
      label: "Amostra",
      icon: "Package",
      permission: "contract-sample.viewAny",
      order: 50,
    },
  ],
};

export default module;
