import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

const AUTH_BUTTON_CLASS = "h-10 w-full";

interface AuthSubmitButtonProps {
  busy: boolean;
  children: ReactNode;
}

export const AuthSubmitButton = ({ busy, children }: AuthSubmitButtonProps) => (
  <Button type="submit" className={`mt-2 ${AUTH_BUTTON_CLASS}`} busy={busy}>
    {children}
  </Button>
);

interface AuthLinkButtonProps {
  to: string;
  variant?: ButtonProps["variant"];
  children: ReactNode;
}

export const AuthLinkButton = ({
  to,
  variant = "default",
  children,
}: AuthLinkButtonProps) => (
  <Button asChild variant={variant} className={AUTH_BUTTON_CLASS}>
    <Link to={to}>{children}</Link>
  </Button>
);

interface AuthActionButtonProps {
  busy: boolean;
  onClick: () => void;
  children: ReactNode;
}

export const AuthActionButton = ({
  busy,
  onClick,
  children,
}: AuthActionButtonProps) => (
  <Button
    variant="ghost"
    className={`mt-2 ${AUTH_BUTTON_CLASS}`}
    busy={busy}
    onClick={onClick}
  >
    {children}
  </Button>
);
