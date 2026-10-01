import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LogOut,
  Menu,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Button } from "../components/actions/Button";
import { AdminNav } from "../components/navigation/AdminNav";
import { Logo } from "../components/navigation/Logo";
import { SiteFooter } from "../components/navigation/SiteFooter";
import { ThemeToggle } from "../components/navigation/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/overlays/DropdownMenu";
import { useSession } from "../stores/session/SessionContext";

const SIDEBAR_KEY = "starterkit.sidebar";

export function AdminLayout() {
  const { state, logout } = useSession();
  const user = state.user;
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem(SIDEBAR_KEY) === "1",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [desktopNavReady, setDesktopNavReady] = useState(false);
  const pendingDesktopGroupFocus = useRef<string | null>(null);
  const desktopNavRef = useRef<{
    expandGroup(moduleName: string): void;
  } | null>(null);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    if (collapsed || !desktopNavReady || !pendingDesktopGroupFocus.current)
      return;
    const moduleName = pendingDesktopGroupFocus.current;
    pendingDesktopGroupFocus.current = null;
    desktopNavRef.current?.expandGroup(moduleName);
  }, [collapsed, desktopNavReady, expandedGroups]);

  const toggleGroup = (moduleName: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(moduleName)) next.delete(moduleName);
      else next.add(moduleName);
      return next;
    });
  };

  const expandSidebarForGroup = (moduleName: string) => {
    pendingDesktopGroupFocus.current = moduleName;
    setCollapsed(false);
    setExpandedGroups((current) => new Set(current).add(moduleName));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="flex min-h-dvh flex-col bg-canvas">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-critical)] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-label focus:text-brand-foreground"
        >
          Ir para o conteúdo
        </a>
        <div aria-hidden="true" className="h-[3px] w-full bg-brand" />
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 md:px-6">
          <div className="flex items-center gap-2">
            <DialogPrimitive.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </DialogPrimitive.Trigger>
            <Logo className="w-[120px] sm:w-[177px]" />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="min-h-11 gap-2 px-2"
                  aria-label="Menu do usuário"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand-hover">
                    <UserIcon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="hidden max-w-40 truncate text-label text-ink sm:inline">
                    {user?.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <span className="block font-semibold text-ink">
                    {user?.name}
                  </span>
                  <span className="block text-caption text-ink-muted">
                    {user?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/password")}>
                  <KeyRound className="size-4" aria-hidden="true" />
                  Alterar senha
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void handleLogout()}>
                  <LogOut className="size-4" aria-hidden="true" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside
            className="sticky top-16 hidden h-[calc(100dvh-67px)] shrink-0 flex-col bg-inverse lg:flex"
            style={{ width: collapsed ? 72 : 272 }}
          >
            <AdminNav
              user={user}
              collapsed={collapsed}
              instance="desktop"
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              onExpandSidebar={expandSidebarForGroup}
              imperativeRef={desktopNavRef}
              onReady={() => setDesktopNavReady(true)}
              onCollapsedGroupActivate={(moduleName) => {
                setExpandedGroups((current) =>
                  new Set(current).add(moduleName),
                );
              }}
            />
            <div className="border-t border-ink-inverse/15 p-3">
              <Button
                variant="ghost"
                className="min-h-11 w-full justify-start gap-3 border-l-[3px] border-transparent px-3 py-2.5 text-ink-inverse hover:bg-ink-inverse/10 hover:text-ink-inverse"
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                aria-pressed={collapsed}
                title={collapsed ? "Expandir menu" : undefined}
              >
                {collapsed ? (
                  <ChevronRight
                    className="size-5 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronLeft className="size-5 shrink-0" aria-hidden="true" />
                )}
                <span className={collapsed ? "sr-only" : undefined}>
                  {collapsed ? "Expandir menu" : "Recolher menu"}
                </span>
              </Button>
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <main
              id="main-content"
              className="min-w-0 flex-1 bg-canvas px-4 pb-6 pt-6 md:px-8 md:pb-8 md:pt-8"
            >
              <div className="mx-auto w-full max-w-[1440px]">
                <Outlet />
              </div>
            </main>
            <SiteFooter variant="admin" />
          </div>
        </div>
      </div>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-scrim lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-[var(--z-modal)] flex w-[272px] flex-col bg-inverse lg:hidden">
          <DialogPrimitive.Title className="sr-only">
            Menu de navegação
          </DialogPrimitive.Title>
          <div className="flex h-16 items-center px-4">
            <Logo variant="inverse" />
          </div>
          <AdminNav
            user={user}
            instance="mobile"
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            onNavigate={() => setMobileOpen(false)}
          />
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              className="m-3 min-h-11 text-ink-inverse hover:bg-ink-inverse/10 hover:text-ink-inverse"
            >
              Fechar menu
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
