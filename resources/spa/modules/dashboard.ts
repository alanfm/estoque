import { matchPath } from "react-router";
import { can, canAny, canAll } from "../lib/permissions";
import type { SessionUser } from "../types/auth";
import type { ModuleNavigationItem, RegisteredModule } from "./types";

/** Usa as permissões efetivas dos papéis, como a navegação lateral. */
export function visibleDashboardModules(
  modules: readonly RegisteredModule[],
  user: SessionUser | null,
): (RegisteredModule & { navigation: ModuleNavigationItem[] })[] {
  if (!user) return [];

  return modules
    .flatMap((module) => {
      const navigation = (module.navigation ?? []).filter((item) => {
        if (item.permission && !can(user, item.permission)) return false;
        const pathname = item.to.split(/[?#]/, 1)[0];
        const route = module.routes?.find((candidate) =>
          matchPath({ path: candidate.path, end: true }, pathname),
        );
        return (
          (!route?.permission || can(user, route.permission)) &&
          (!route?.permissionsAny || canAny(user, route.permissionsAny)) &&
          (!route?.permissionsAll || canAll(user, route.permissionsAll))
        );
      });
      return navigation.length ? [{ ...module, navigation }] : [];
    })
    .sort((left, right) => (left.order ?? 100) - (right.order ?? 100));
}
