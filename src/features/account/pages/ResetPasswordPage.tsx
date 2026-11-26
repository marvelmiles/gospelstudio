import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, KeyRound, LinkIcon, LogIn } from "lucide-react";
import { API_ERROR_CODES } from "@/contracts/apiErrors";
import {
  newPasswordSchema,
  PASSWORD_MIN_LENGTH,
} from "@/contracts/accountContract";
import {
  PASSWORD_RESET_TOKEN_PARAM,
  resetTokenSchema,
} from "@/contracts/authContract";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/Field";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSubmission } from "../../../hooks/useSubmission";
import { ApiRequestError } from "../../../lib/jsonApi";
import routes from "../../../routes";
import { completePasswordReset } from "../api/authApi";
import { AuthLink } from "../components/AuthLink";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { FormProblem } from "../components/FormProblem";
import { OfflineNotice } from "../components/OfflineNotice";

const tokenFromLink = (): string | null => {
  const token = new URLSearchParams(window.location.hash.slice(1)).get(
    PASSWORD_RESET_TOKEN_PARAM,
  );
  return resetTokenSchema.safeParse(token).success ? token : null;
};

const RequestNewLink = () => (
  <Button asChild variant="secondary" className="w-full">
    <Link to={routes.forgotPassword()}>
      <LinkIcon size={15} />
      Ask for a new link
    </Link>
  </Button>
);

export const ResetPasswordPage = () => {
  useDocumentTitle("Choose a new password");
  const [token] = useState(tokenFromLink);
  const { busy, problem, submit } = useSubmission();
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLinkSpent, setIsLinkSpent] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (window.location.hash)
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const parsed = newPasswordSchema.safeParse(password);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setFieldError(null);
    const reset = await submit(async () => {
      try {
        await completePasswordReset({ token, password: parsed.data });
      } catch (error) {
        if (
          error instanceof ApiRequestError &&
          error.code === API_ERROR_CODES.invalidResetToken
        )
          setIsLinkSpent(true);
        throw error;
      }
    });
    if (reset) setIsDone(true);
  };

  if (isDone)
    return (
      <AuthPageLayout
        icon={CircleCheck}
        title="Password updated"
        description="Your new password is ready. Every device was signed out, so sign in again where you use GospelStudio."
      >
        <Button asChild className="w-full">
          <Link to={routes.signIn()}>
            <LogIn size={15} />
            Sign in
          </Link>
        </Button>
      </AuthPageLayout>
    );

  if (!token)
    return (
      <AuthPageLayout
        icon={LinkIcon}
        title="This link is incomplete"
        description="Open the link from the email again, or ask for a new one."
      >
        <RequestNewLink />
      </AuthPageLayout>
    );

  return (
    <AuthPageLayout
      icon={KeyRound}
      title="Choose a new password"
      description="Pick a password you don't use anywhere else."
      footer={
        <>
          <span>Changed your mind?</span>
          <AuthLink to={routes.signIn()}>Sign in</AuthLink>
        </>
      }
    >
      <OfflineNotice message="You're offline. Choose your new password once you're back online." />
      <FormProblem problem={problem} />
      {isLinkSpent ? (
        <RequestNewLink />
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Field label="New password" error={fieldError}>
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldError)}
            />
            {!fieldError && (
              <span className="mt-1.5 block text-[11.5px] text-muted-foreground">
                At least {PASSWORD_MIN_LENGTH} characters.
              </span>
            )}
          </Field>
          <Button type="submit" className="mt-1 w-full" busy={busy}>
            Save new password
          </Button>
        </form>
      )}
    </AuthPageLayout>
  );
};
