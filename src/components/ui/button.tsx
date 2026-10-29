import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-[13.5px] font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary-soft/35 bg-primary text-primary-foreground shadow-cta enabled:hover:bg-primary/90",
        secondary:
          "border-border bg-secondary text-secondary-foreground enabled:hover:bg-secondary/80 aria-pressed:border-primary/30 aria-pressed:bg-primary/16 aria-pressed:text-primary-soft data-[state=open]:border-primary/30 data-[state=open]:bg-primary/16 data-[state=open]:text-primary-soft",
        ghost:
          "text-muted-foreground enabled:hover:bg-accent enabled:hover:text-accent-foreground aria-pressed:border-primary/30 aria-pressed:bg-primary/16 aria-pressed:text-primary-soft data-[state=open]:border-primary/30 data-[state=open]:bg-primary/16 data-[state=open]:text-primary-soft",
        destructive:
          "border-destructive/30 bg-destructive/14 text-destructive focus-visible:ring-destructive/40 enabled:hover:bg-destructive/22",
        link: "text-primary-soft underline-offset-4 enabled:hover:underline",
      },
      size: {
        default: "h-9 px-3.5 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-2.75 text-[12.5px] has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 rounded-xl px-5 text-[15px] has-[>svg]:px-4",
        icon: "size-8.5 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-7.5 [&_svg:not([class*='size-'])]:size-3.75",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    busy?: boolean;
  };

const Button = ({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  busy = false,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={asChild ? undefined : "button"}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {busy ? (
        <Spinner
          className={variant === "default" ? "text-primary-foreground" : ""}
        />
      ) : (
        children
      )}
    </Comp>
  );
};

export { Button, type ButtonProps };
