import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router";
import { Logo } from "../components/navigation/Logo";
import { SiteFooter } from "../components/navigation/SiteFooter";
import { Button } from "../components/actions/Button";

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <div id="page-top" className="flex min-h-dvh flex-col bg-surface">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-critical)] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-label focus:text-brand"
        >
          Ir para o conteúdo
        </a>
        <div aria-hidden="true" className="h-1 w-full bg-brand" />
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex min-h-20 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
            <Link
              to="/"
              aria-label="IFCE Campus Sobral — início"
              className="inline-flex shrink-0 rounded-sm p-1"
            >
              <Logo className="w-[182px] sm:w-[216px]" />
            </Link>
            <nav
              aria-label="Navegação principal"
              className="hidden items-center gap-7 lg:flex"
            >
              <Link
                to="/"
                className="text-label font-semibold text-ink no-underline hover:text-brand"
              >
                Início
              </Link>
              <Button asChild variant="secondary">
                <Link to="/login">Entrar</Link>
              </Button>
            </nav>
            <DialogPrimitive.Trigger asChild>
              <Button
                variant="secondary"
                className="min-h-11 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" aria-hidden="true" />
                <span className="hidden sm:inline">Menu</span>
              </Button>
            </DialogPrimitive.Trigger>
          </div>
        </header>
        <main id="main-content" className="flex-1 px-4 py-10 md:px-6">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
        <SiteFooter />
      </div>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-scrim lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-x-0 top-0 z-[var(--z-modal)] grid gap-4 border-b border-line bg-surface p-6 shadow-overlay lg:hidden">
          <DialogPrimitive.Title className="text-h3">
            Menu
          </DialogPrimitive.Title>
          <nav aria-label="Navegação mobile" className="grid gap-2">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="rounded-md p-2 text-label text-ink no-underline hover:bg-subtle"
            >
              Início
            </Link>
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-md p-2 text-label text-ink no-underline hover:bg-subtle"
            >
              Entrar
            </Link>
          </nav>
          <DialogPrimitive.Close asChild>
            <Button variant="secondary" className="min-h-11 justify-self-start">
              Fechar menu
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
