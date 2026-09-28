import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function Spinner({
  className,
  label = "Carregando",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center text-ink-muted", className)}
    >
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
