import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Checkbox } from "./Checkbox";

export interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField({ id, label, description, className, ...props }, ref) {
    return (
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 transition-colors hover:bg-subtle/60",
          className,
        )}
      >
        <Checkbox ref={ref} id={id} className="mt-0.5" {...props} />
        <span className="space-y-0.5">
          <span className="block text-body-sm font-medium text-ink">
            {label}
          </span>
          {description ? (
            <span className="block text-caption text-ink-muted">
              {description}
            </span>
          ) : null}
        </span>
      </label>
    );
  },
);
