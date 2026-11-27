import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import routes from "../../../routes";

interface AuthLinkProps {
  to: string;
  state?: unknown;
  children: ReactNode;
}

export const AuthLink = ({ to, state, children }: AuthLinkProps) => (
  <Link
    to={to}
    state={state}
    className="inline-flex items-center gap-1 font-semibold text-primary-soft underline-offset-4 hover:underline focus-visible:underline"
  >
    {children}
  </Link>
);

export const BackToSignInLink = () => (
  <AuthLink to={routes.signIn()}>
    <ArrowLeft size={14} aria-hidden />
    Back to sign in
  </AuthLink>
);
