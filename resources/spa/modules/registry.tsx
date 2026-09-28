import { createElement, lazy, Suspense } from "react";
import type { RouteObject } from "react-router";
import { Spinner } from "../components/feedback/Spinner";
import { RequirePermission } from "../router/guards";
import type {
  FrontendModule,
  FrontendModuleRegistry,
  ModuleEntry,
  ModuleNavigationItem,
  ModuleRoute,
  RegisteredModule,
} from "./types";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Carrega, valida e agrega as extensões frontend dos módulos.
 *
 * Um módulo com falha é isolado: os demais continuam registrados e o problema
 * é exposto em `issues` para diagnóstico.
 */
export async function createModuleRegistry(
  entries: readonly ModuleEntry[],
): Promise<FrontendModuleRegistry> {
  const issues: string[] = [];
  const modules: RegisteredModule[] = [];
  const routes: ModuleRoute[] = [];
  const navigation: ModuleNavigationItem[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.name)) {
      issues.push(`Identificador de módulo duplicado: "${entry.name}".`);
      continue;
    }

    seen.add(entry.name);

    let module: FrontendModule;

    try {
      module = (await entry.load()).default;
    } catch (error) {
      issues.push(
        `Falha ao carregar o módulo "${entry.name}": ${messageOf(error)}`,
      );
      continue;
    }

    if (!module || module.name !== entry.name) {
      issues.push(
        `Módulo "${entry.name}" declara nome divergente no contrato frontend.`,
      );
      continue;
    }

    const moduleRoutes = [...(module.routes ?? [])];
    const moduleNavigation = [...(module.navigation ?? [])];

    try {
      module.register?.({
        moduleName: module.name,
        registerRoutes: (registered) => moduleRoutes.push(...registered),
        registerNavigation: (items) => moduleNavigation.push(...items),
      });
    } catch (error) {
      issues.push(
        `Falha ao registrar o módulo "${entry.name}": ${messageOf(error)}`,
      );
      continue;
    }

    routes.push(...moduleRoutes);
    navigation.push(...moduleNavigation);
    modules.push({
      name: module.name,
      displayName: module.displayName ?? module.name,
    });
  }

  navigation.sort((left, right) => (left.order ?? 100) - (right.order ?? 100));

  return { modules, routes, navigation, issues };
}

/** Converte as rotas dos módulos em objetos do React Router com guards. */
export function createModuleRoutes(
  routes: readonly ModuleRoute[],
): RouteObject[] {
  return routes.map((route) => {
    const Component = lazy(route.load);
    const page = createElement(
      Suspense,
      { fallback: createElement(Spinner, { label: "Carregando módulo" }) },
      createElement(Component),
    );

    const guarded =
      route.permission || route.permissionsAny || route.permissionsAll
        ? createElement(
            RequirePermission,
            {
              permission: route.permission,
              any: route.permissionsAny,
              all: route.permissionsAll,
            },
            page,
          )
        : page;

    return { path: route.path, element: guarded };
  });
}
