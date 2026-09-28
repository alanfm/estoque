import { AlertCircle } from "lucide-react";
import { cloneElement, type ReactElement } from "react";
import { cn } from "../../lib/utils";
import { Label } from "./Label";

export interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactElement;
}

export function Field({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = cloneElement(children, {
    id,
    required,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  } as Record<string, unknown>);

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger-status">
            {" "}
            *
          </span>
        ) : null}
      </Label>
      {control}
      {hint && !error ? (
        <p id={hintId} className="text-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="flex items-center gap-1 text-caption text-danger-status"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
