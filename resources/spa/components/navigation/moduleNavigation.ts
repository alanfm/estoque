import { can } from "../../lib/permissions";
import type {
  ModuleNavigationItem,
  RegisteredModuleNavigationGroup,
} from "../../modules/types";
import type { SessionUser } from "../../types/auth";

export interface VisibleModuleNavigationGroup extends RegisteredModuleNavigationGroup {
  items: VisibleModuleNavigationItem[];
  activeItem?: ModuleNavigationItem;
}

export interface VisibleModuleNavigationItem extends ModuleNavigationItem {
  active: boolean;
}

export interface VisibleModuleNavigation {
  standaloneItems: VisibleModuleNavigationItem[];
  groups: VisibleModuleNavigationGroup[];
}

function normalizePath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

function matchesPath(item: ModuleNavigationItem, pathname: string): boolean {
  const to = normalizePath(item.to);
  if (item.end) return pathname === to;
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function isVisible(item: ModuleNavigationItem, user: SessionUser | null) {
  return !item.permission || can(user, item.permission);
}

function activeItemFor(
  items: readonly ModuleNavigationItem[],
  pathname: string,
): ModuleNavigationItem | undefined {
  return items
    .map((item, index) => ({ item, index, path: normalizePath(item.to) }))
    .filter(({ item }) => matchesPath(item, pathname))
    .sort(
      (left, right) =>
        right.path.length - left.path.length || left.index - right.index,
    )[0]?.item;
}

export function deriveModuleNavigation({
  navigation,
  navigationGroups,
  user,
  pathname,
}: {
  navigation: readonly ModuleNavigationItem[];
  navigationGroups: readonly RegisteredModuleNavigationGroup[];
  user: SessionUser | null;
  pathname: string;
}): VisibleModuleNavigation {
  const groupedItems = new Set(
    navigationGroups.flatMap((group) => group.items),
  );
  const normalizedPath = normalizePath(pathname);

  const standaloneItems = navigation
    .filter((item) => !groupedItems.has(item) && isVisible(item, user))
    .map((item) => ({ ...item, active: matchesPath(item, normalizedPath) }));

  const groups = navigationGroups.flatMap((group) => {
    const authorizedItems = group.items.filter((item) => isVisible(item, user));
    if (authorizedItems.length === 0) return [];

    const activeItem = activeItemFor(authorizedItems, normalizedPath);
    return [
      {
        ...group,
        items: authorizedItems.map((item) => ({
          ...item,
          active: item === activeItem,
        })),
        activeItem,
      } satisfies VisibleModuleNavigationGroup,
    ];
  });

  return { standaloneItems, groups };
}
