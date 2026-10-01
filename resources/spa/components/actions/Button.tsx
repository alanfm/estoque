import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border text-label font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled disabled:text-disabled-foreground disabled:hover:border-disabled-border disabled:hover:bg-disabled disabled:hover:text-disabled-foreground",
  {
    variants: {
      variant: {
        primary:
          "border-brand bg-brand text-brand-foreground hover:border-brand-hover hover:bg-brand-hover",
        secondary:
          "border-line-strong bg-surface text-ink hover:border-brand hover:bg-subtle hover:text-brand-hover",
        ghost:
          "border-transparent bg-transparent text-brand hover:bg-subtle hover:text-brand-hover",
        danger:
          "border-danger bg-danger text-danger-foreground hover:border-danger-hover hover:bg-danger-hover",
        link: "border-transparent bg-transparent text-brand underline underline-offset-2 hover:border-transparent hover:bg-transparent hover:text-brand-hover disabled:border-transparent disabled:bg-transparent disabled:no-underline disabled:hover:border-transparent disabled:hover:bg-transparent disabled:hover:no-underline",
      },
      size: {
        compact: "h-8 px-3",
        default: "h-10 px-4",
        comfortable: "h-12 px-5 text-body",
        icon: "size-10",
        iconCompact: "size-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    const Component = (asChild ? Slot : "button") as React.ElementType;

    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        <Slottable>{children}</Slottable>
      </Component>
    );
  },
);
