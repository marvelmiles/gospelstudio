import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLinkProps {
  to: string;
  children: ReactNode;
}

export const AuthLink = ({ to, children }: AuthLinkProps) => (
  <Link
    to={to}
    className="font-semibold text-primary-soft underline-offset-4 hover:underline focus-visible:underline"
  >
    {children}
  </Link>
);
