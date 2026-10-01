import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useImperativeHandle, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import { resolveModuleGroupIcon, resolveModuleIcon } from "../../lib/icons";
import { can } from "../../lib/permissions";
import { cn } from "../../lib/utils";
import { useModules } from "../../modules/ModulesContext";
import type { SessionUser } from "../../types/auth";
import { deriveModuleNavigation } from "./moduleNavigation";

interface NavItem {
  to: string;
  label: string;
  icon?: LucideIcon;
  permission?: string;
  end?: boolean;
}

const workspaceItems: NavItem[] = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
  {
    to: "/admin/users",
    label: "Usuários",
    icon: Users,
    permission: "users.viewAny",
  },
  {
    to: "/admin/roles",
    label: "Papéis",
    icon: ShieldCheck,
    permission: "roles.viewAny",
  },
];

export function AdminNav({
  user,
  collapsed = false,
  instance = "desktop",
  expandedGroups,
  onToggleGroup,
  onExpandSidebar,
  imperativeRef,
  onNavigate,
  onCollapsedGroupActivate,
  onReady,
}: {
  user: SessionUser | null;
  collapsed?: boolean;
  instance?: string;
  expandedGroups?: ReadonlySet<string>;
  onToggleGroup?(moduleName: string): void;
  onExpandSidebar?(moduleName: string): void;
  imperativeRef?: React.Ref<{ expandGroup(moduleName: string): void }>;
  onNavigate?(): void;
  onCollapsedGroupActivate?(moduleName: string): void;
  onReady?(): void;
}) {
  const { navigation, navigationGroups } = useModules();
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const groupToggles = useRef(new Map<string, HTMLButtonElement>());
  useImperativeHandle(
    imperativeRef,
    () => ({
      expandGroup(moduleName) {
        groupToggles.current.get(moduleName)?.focus();
      },
    }),
    [],
  );
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  const visible = deriveModuleNavigation({
    navigation,
    navigationGroups,
    user,
    pathname,
  });
  const expanded = expandedGroups ?? new Set<string>();
  const focusParentBeforeCollapse = (moduleName: string) => {
    const current = expandedGroups ?? new Set<string>();
    const activeElement = document.activeElement;
    const controlledList = document.getElementById(
      `module-nav-${instance}-${moduleName.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    );
    if (current.has(moduleName) && controlledList?.contains(activeElement)) {
      groupToggles.current.get(moduleName)?.focus();
    }
  };

  useEffect(() => {
    const active = visible.groups.find((group) => group.activeItem);
    if (active && !expanded.has(active.moduleName)) {
      onToggleGroup?.(active.moduleName);
    }
    // Route changes should open the active group. Manual closing remains until
    // the location changes again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderLink = (
    item: NavItem & { active?: boolean },
    key: string,
    nested = false,
  ) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={key}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            "group relative flex min-h-11 items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            nested && "ml-3 pl-4",
            (item.active ?? isActive)
              ? "border-ink-inverse bg-ink-inverse/15 text-ink-inverse"
              : "border-transparent text-ink-inverse hover:bg-ink-inverse/10",
          )
        }
        aria-current={item.active ? "page" : undefined}
      >
        {Icon ? <Icon className="size-5 shrink-0" aria-hidden="true" /> : null}
        <span className={cn(collapsed && "sr-only")}>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <nav
      ref={navRef}
      aria-label="Navegação administrativa"
      className="flex flex-1 flex-col overflow-y-auto p-3"
    >
      <ul className="grid list-none gap-1 p-0">
        <li>
          <span
            className={cn(
              "block px-3 pb-2 text-caption font-bold uppercase tracking-widest text-ink-inverse/75",
              collapsed && "sr-only",
            )}
          >
            Espaço de trabalho
          </span>
        </li>
        {workspaceItems
          .filter((item) => !item.permission || can(user, item.permission))
          .map((item) => (
            <li key={item.to}>{renderLink(item, item.to)}</li>
          ))}
        {visible.standaloneItems.map((item) => {
          const icon = resolveModuleIcon(item.icon);
          return (
            <li key={item.to}>
              {renderLink({ ...item, icon, active: item.active }, item.to)}
            </li>
          );
        })}
        {visible.groups.map((group) => {
          const Icon = resolveModuleGroupIcon(group.icon);
          const isOpen = expanded.has(group.moduleName);
          const isActive = Boolean(group.activeItem);
          const listId = `module-nav-${instance}-${group.moduleName.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

          return (
            <li key={group.moduleName}>
              <button
                ref={(element) => {
                  if (element)
                    groupToggles.current.set(group.moduleName, element);
                  else groupToggles.current.delete(group.moduleName);
                }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={listId}
                id={`${listId}-toggle`}
                title={collapsed ? group.label : undefined}
                onClick={() => {
                  if (collapsed) {
                    onCollapsedGroupActivate?.(group.moduleName);
                    onExpandSidebar?.(group.moduleName);
                  } else {
                    focusParentBeforeCollapse(group.moduleName);
                    onToggleGroup?.(group.moduleName);
                  }
                }}
                className={cn(
                  "group relative flex min-h-11 w-full items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-left text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  isActive
                    ? "border-ink-inverse bg-ink-inverse/10 text-ink-inverse"
                    : "border-transparent text-ink-inverse hover:bg-ink-inverse/10",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    collapsed && "sr-only",
                  )}
                >
                  {group.label}
                </span>
                {!collapsed ? (
                  isOpen ? (
                    <ChevronDown
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronRight
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                  )
                ) : null}
              </button>
              <ul
                id={listId}
                hidden={!isOpen}
                inert={collapsed}
                className="grid list-none gap-1 p-0 pt-1"
              >
                {group.items.map((item) => (
                  <li key={item.to}>
                    {renderLink(
                      {
                        ...item,
                        icon: resolveModuleIcon(item.icon),
                        active: item.active,
                      },
                      item.to,
                      true,
                    )}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
