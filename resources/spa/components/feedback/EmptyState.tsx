import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line bg-surface p-10 text-center",
        className,
      )}
    >
      <Icon className="size-8 text-ink-muted" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-h3">{title}</p>
        {description ? (
          <p className="text-body-sm text-ink-secondary">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
