import logoVertical from "../../assets/logo_v.png";
import { siteConfig } from "../../config/site";
import { cn } from "../../lib/utils";

export function SiteFooter({
  variant = "public",
  className,
}: {
  variant?: "public" | "admin";
  className?: string;
}) {
  const isPublic = variant === "public";

  if (!isPublic) {
    return (
      <footer
        className={cn(
          "border-t border-line bg-canvas text-caption text-ink-secondary",
          className,
        )}
      >
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 items-center gap-4 px-4 py-3 md:px-8 text-sm font-light">
          <span>
            &copy; 2026 - Instituto Federal do Ceará - <em>campus</em> Sobral.
          </span>
          <span className="text-right">
            Desenvolvido pela CTI - <em>campus</em> Sobral
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={cn(
        "border-t border-line bg-subtle text-body-sm text-ink-secondary",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
        <div className="flex flex-col justify-between gap-6 py-6 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4 sm:gap-6">
            <img
              src={logoVertical}
              alt=""
              width={737}
              height={1045}
              className="h-auto w-[76px] shrink-0 sm:w-[95px]"
            />
            <div className="grid gap-1">
              <strong className="text-label text-ink">
                {siteConfig.institution} · {siteConfig.campus}
              </strong>
              <address className="not-italic">
                {siteConfig.address} · CEP {siteConfig.postalCode}
              </address>
              <a
                className="w-fit font-semibold underline underline-offset-2"
                href={`tel:+55${siteConfig.phone.replace(/\D/g, "")}`}
              >
                {siteConfig.phone}
              </a>
              <a
                className="w-fit break-all font-semibold underline underline-offset-2"
                href={`mailto:${siteConfig.email}`}
              >
                {siteConfig.email}
              </a>
            </div>
          </div>
          <nav
            aria-label="Links institucionais"
            className="grid gap-2 sm:shrink-0"
          >
            <a
              className="underline underline-offset-2"
              href="https://portal.ifce.edu.br/campus/sobral/"
            >
              Portal do campus
            </a>
            <a
              className="underline underline-offset-2"
              href="https://portal.ifce.edu.br/campus/sobral/contatos/"
            >
              Contatos
            </a>
            <a className="underline underline-offset-2" href="#page-top">
              Voltar ao topo
            </a>
          </nav>
        </div>
        <p className="border-t border-line py-4 text-caption text-ink-muted">
          {siteConfig.developerCredit}
        </p>
      </div>
    </footer>
  );
}
