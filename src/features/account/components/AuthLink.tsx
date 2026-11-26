import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLinkProps {
  to: string;
  state?: unknown;
  children: ReactNode;
}

export const AuthLink = ({ to, state, children }: AuthLinkProps) => (
  <Link
    to={to}
    state={state}
    className="font-semibold text-primary-soft underline-offset-4 hover:underline focus-visible:underline"
  >
    {children}
  </Link>
);
