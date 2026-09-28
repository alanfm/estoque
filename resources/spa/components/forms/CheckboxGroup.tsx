import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function CheckboxGroup({
  legend,
  description,
  error,
  className,
  children,
}: {
  legend: string;
  description?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={cn("space-y-3", className)}>
      <legend className="text-label text-ink">{legend}</legend>
      {description ? (
        <p className="text-caption text-ink-muted">{description}</p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
      {error ? (
        <p className="text-caption text-danger-status">{error}</p>
      ) : null}
    </fieldset>
  );
}
