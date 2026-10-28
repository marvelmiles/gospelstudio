import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[11px] border font-semibold whitespace-nowrap transition-all duration-150 enabled:hover:brightness-110 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "border-accent-soft/35 bg-accent text-on-accent shadow-[0_6px_20px_rgb(37_99_235/0.32),inset_0_1px_0_rgb(255_255_255/0.14)]",
        ghost: "border-line bg-raise text-fg",
        subtle: "border-transparent bg-transparent text-sub",
        danger: "border-danger/30 bg-danger/14 text-danger",
      },
      size: {
        sm: "px-2.75 py-1.5 text-[12.5px]",
        md: "px-3.75 py-2.25 text-[13.5px]",
        lg: "px-5 py-3 text-[15px]",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}

export const Button = ({
  children,
  onClick,
  variant,
  size,
  title,
  disabled,
  busy,
  className,
}: ButtonProps) => (
  <button
    title={title}
    disabled={disabled || busy}
    onClick={onClick}
    className={cn(
      buttonVariants({ variant, size }),
      disabled && "opacity-50",
      className,
    )}
  >
    {busy ? (
      <Spinner
        size={size === "sm" ? 13 : 15}
        className={variant === "primary" ? "text-on-accent" : "text-accent"}
      />
    ) : (
      children
    )}
  </button>
);

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-[9px] border transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      tone: {
        plain:
          "border-transparent bg-transparent text-sub enabled:hover:bg-raise",
        filled: "border-line bg-raise text-sub",
        active:
          "border-accent/30 bg-accent/16 text-accent-soft enabled:hover:bg-accent/22",
      },
      danger: { true: "text-danger enabled:hover:bg-danger/16" },
      size: {
        sm: "size-7.25 [&_svg]:size-3.75",
        md: "size-8.5 [&_svg]:size-[16.5px]",
      },
    },
    defaultVariants: { tone: "plain", size: "md" },
  },
);

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  title: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  filled?: boolean;
}

export const IconButton = ({
  icon: Icon,
  onClick,
  title,
  active,
  danger,
  disabled,
  size,
  filled,
}: IconButtonProps) => (
  <button
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={iconButtonVariants({
      tone: active ? "active" : filled ? "filled" : "plain",
      danger,
      size,
    })}
  >
    <Icon />
  </button>
);

interface StageButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  title: string;
  active?: boolean;
  solid?: boolean;
}

export const StageButton = ({
  icon: Icon,
  onClick,
  title,
  active,
  solid,
}: StageButtonProps) => (
  <button
    title={title}
    aria-label={title}
    onClick={onClick}
    className={cn(
      "grid size-10 place-items-center rounded-[10px] border border-stage-line text-white",
      active
        ? "bg-accent/30 text-accent-soft"
        : solid
          ? "bg-white/10"
          : "bg-white/6",
    )}
  >
    <Icon size={18} />
  </button>
);
