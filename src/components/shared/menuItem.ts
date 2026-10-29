import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  label?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  divider?: boolean;
}

export const activeMenuItemClassName =
  "bg-primary/12 text-primary-soft focus:bg-primary/20 focus:text-primary-soft [&_svg]:text-primary-soft!";
