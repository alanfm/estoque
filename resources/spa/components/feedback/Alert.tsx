import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

const alertVariants = cva("flex gap-3 rounded-md border p-4 text-body-sm", {
  variants: {
    variant: {
      success: "border-success bg-success-surface text-success",
      warning: "border-warning bg-warning-surface text-warning",
      danger:
        "border-danger-status bg-danger-status-surface text-danger-status",
      info: "border-info bg-info-surface text-info",
      neutral: "border-neutral bg-neutral-surface text-neutral",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  neutral: ShieldAlert,
} as const;

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  children?: ReactNode;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[variant ?? "info"];

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}
