export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-critical)] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-label focus:text-brand-foreground"
    >
      Ir para o conteúdo
    </a>
  );
}
