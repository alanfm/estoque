import { createContext, useContext, type ReactNode } from "react";
import type { FrontendModuleRegistry } from "./types";

const EMPTY_REGISTRY: FrontendModuleRegistry = {
  modules: [],
  routes: [],
  navigation: [],
  issues: [],
};

const ModulesContext = createContext<FrontendModuleRegistry>(EMPTY_REGISTRY);

export function ModulesProvider({
  registry,
  children,
}: {
  registry: FrontendModuleRegistry;
  children: ReactNode;
}) {
  return (
    <ModulesContext.Provider value={registry}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules(): FrontendModuleRegistry {
  return useContext(ModulesContext);
}
