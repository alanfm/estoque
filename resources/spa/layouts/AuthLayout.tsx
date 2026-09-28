import { Check } from "lucide-react";
import { Link, Outlet } from "react-router";
import { Logo } from "../components/navigation/Logo";
import { siteConfig } from "../config/site";

const highlights = [
  "Informações claras em cada etapa",
  "Acesso seguro e navegação acessível",
  "Layout que se adapta ao seu dispositivo",
];

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col border-t-4 border-brand bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-critical)] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-label focus:text-brand"
      >
        Ir para o conteúdo
      </a>

      <header className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-[18px] px-6 py-[25px]">
        <Link
          to="/"
          aria-label={`${siteConfig.systemName} — página inicial`}
          className="inline-flex shrink-0 items-center rounded-sm p-1"
        >
          <Logo className="w-[218px]" />
        </Link>
      </header>

      <main
        id="main-content"
        className="mx-auto grid w-full max-w-[1160px] flex-1 grid-cols-1 items-center gap-[22px] px-4 pb-12 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:gap-[7vw] lg:px-6 lg:pb-[72px] lg:pt-8"
      >
        <section
          aria-label="Apresentação do sistema"
          className="hidden max-w-[540px] lg:block"
        >
          <span className="block text-caption font-extrabold uppercase tracking-[0.12em] text-brand">
            {siteConfig.campus} · Acesso institucional
          </span>
          <h2 className="mb-5 mt-[18px] text-[clamp(34px,4vw,52px)] font-extrabold leading-[1.1] tracking-[-0.045em]">
            Seu espaço de trabalho, simples e organizado.
          </h2>
          <p className="max-w-[500px] text-body-lg leading-[1.65] text-ink-secondary">
            Uma experiência direta para equipes que precisam acompanhar
            processos, consultar dados e tomar decisões com confiança.
          </p>
          <ul className="mt-7 grid list-none gap-[13px] p-0 text-body-sm text-ink-secondary">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <b
                  aria-hidden="true"
                  className="inline-grid size-6 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand-hover"
                >
                  <Check className="size-3.5" />
                </b>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="w-full rounded-lg border border-line bg-surface p-6 shadow-raised lg:p-8">
          <Outlet />
        </section>
      </main>

      <footer className="mx-auto grid w-full max-w-[1160px] grid-cols-1 gap-x-6 gap-y-[14px] border-t border-line px-4 pb-7 pt-5 sm:grid-cols-2 lg:px-6">
        <div className="grid content-start gap-0.5 text-body-sm text-ink-secondary">
          <strong className="text-label text-ink">
            {siteConfig.campus} — {siteConfig.institution}
          </strong>
          <span>
            {siteConfig.address} · CEP {siteConfig.postalCode}
          </span>
        </div>
        <div className="grid content-start gap-0.5 text-body-sm text-ink-secondary">
          <a
            href={`tel:+55${siteConfig.phone.replace(/\D/g, "")}`}
            className="font-semibold"
          >
            {siteConfig.phone}
          </a>
          <a href={`mailto:${siteConfig.email}`} className="font-semibold">
            {siteConfig.email}
          </a>
        </div>
        <small className="text-caption text-ink-muted sm:col-span-2">
          {siteConfig.developerCredit}
        </small>
      </footer>
    </div>
  );
}
