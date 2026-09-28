import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router";
import { resolveModuleIcon } from "../../lib/icons";
import { can } from "../../lib/permissions";
import { cn } from "../../lib/utils";
import { useModules } from "../../modules/ModulesContext";
import type { SessionUser } from "../../types/auth";

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
  onNavigate,
}: {
  user: SessionUser | null;
  collapsed?: boolean;
  onNavigate?(): void;
}) {
  const { navigation } = useModules();

  const moduleItems: NavItem[] = navigation.map((item) => ({
    to: item.to,
    label: item.label,
    icon: resolveModuleIcon(item.icon),
    permission: item.permission,
    end: item.end,
  }));

  return (
    <nav
      aria-label="Navegação administrativa"
      className="flex flex-1 flex-col overflow-y-auto p-3"
    >
      <div className="grid gap-1">
        <span
          className={cn(
            "px-3 pb-2 text-caption font-bold uppercase tracking-widest text-ink-inverse/75",
            collapsed && "sr-only",
          )}
        >
          Espaço de trabalho
        </span>
        {[...workspaceItems, ...moduleItems]
          .filter((item) => !item.permission || can(user, item.permission))
          .map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "group relative flex min-h-11 items-center gap-3 rounded-md border-l-[3px] px-3 py-2.5 text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    isActive
                      ? "border-ink-inverse bg-ink-inverse/15 text-ink-inverse"
                      : "border-transparent text-ink-inverse hover:bg-ink-inverse/10",
                  )
                }
              >
                {Icon ? (
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                ) : null}
                <span className={cn(collapsed && "sr-only")}>{item.label}</span>
              </NavLink>
            );
          })}
      </div>
    </nav>
  );
}
