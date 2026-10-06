import type { ComponentType } from "react";

/** Rota registrada por um módulo, relativa à raiz da SPA. */
export interface ModuleRoute {
  path: string;
  load: () => Promise<{ default: ComponentType }>;
  permission?: string;
  permissionsAny?: string[];
  permissionsAll?: string[];
}

/** Item de navegação exibido no AdminLayout. */
export interface ModuleNavigationItem {
  to: string;
  label: string;
  icon?: string;
  permission?: string;
  end?: boolean;
  order?: number;
}

/** Configuração opcional do grupo de navegação de um módulo. */
export interface ModuleNavigationGroup {
  icon?: string;
  order?: number;
}

/** API recebida por `FrontendModule.register`. */
export interface ModuleContext {
  moduleName: string;
  registerRoutes(routes: ModuleRoute[]): void;
  registerNavigation(items: ModuleNavigationItem[]): void;
}

/** Contrato público do frontend de um módulo. */
export interface FrontendModule {
  name: string;
  displayName?: string;
  navigationGroup?: ModuleNavigationGroup;
  routes?: ModuleRoute[];
  navigation?: ModuleNavigationItem[];
  register?(context: ModuleContext): void;
}

/** Entrada do módulo injetada no build pelo plugin Vite do host. */
export interface ModuleEntry {
  name: string;
  load: () => Promise<{ default: FrontendModule }>;
}

export interface RegisteredModule {
  name: string;
  displayName: string;
  /** Navegação do módulo, incluindo contribuições de registerNavigation. */
  navigation?: ModuleNavigationItem[];
  routes?: ModuleRoute[];
  icon?: string;
  order?: number;
}

/** Projeção de navegação agrupada, mantendo a lista plana legada. */
export interface RegisteredModuleNavigationGroup {
  moduleName: string;
  label: string;
  icon?: string;
  order: number;
  registrationOrder: number;
  items: ModuleNavigationItem[];
}

/** Resultado da validação e do registro dos módulos na SPA. */
export interface FrontendModuleRegistry {
  modules: RegisteredModule[];
  routes: ModuleRoute[];
  navigation: ModuleNavigationItem[];
  navigationGroups: RegisteredModuleNavigationGroup[];
  issues: string[];
}
