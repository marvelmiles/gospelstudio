import { useEffect, useState, type FormEvent } from "react";
import { CircleCheck, Link2Off } from "lucide-react";
import { API_ERROR_CODES } from "@/contracts/apiErrors";
import {
  newPasswordSchema,
  PASSWORD_MIN_LENGTH,
} from "@/contracts/accountContract";
import {
  PASSWORD_RESET_TOKEN_PARAM,
  resetTokenSchema,
} from "@/contracts/authContract";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSubmission } from "../../../hooks/useSubmission";
import { ApiRequestError } from "../../../lib/jsonApi";
import routes from "../../../routes";
import { completePasswordReset } from "../api/authApi";
import { AuthLinkButton, AuthSubmitButton } from "../components/AuthButtons";
import { AuthField } from "../components/AuthField";
import { BackToSignInLink } from "../components/AuthLink";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { FormProblem } from "../components/FormProblem";

const tokenFromLink = (): string | null => {
  const token = new URLSearchParams(window.location.hash.slice(1)).get(
    PASSWORD_RESET_TOKEN_PARAM,
  );
  return resetTokenSchema.safeParse(token).success ? token : null;
};

const RequestNewLink = () => (
  <AuthLinkButton to={routes.forgotPassword()}>Get a new link</AuthLinkButton>
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
        description="You've been signed out on all devices."
      >
        <AuthLinkButton to={routes.signIn()}>Sign in</AuthLinkButton>
      </AuthPageLayout>
    );

  if (!token)
    return (
      <AuthPageLayout
        icon={Link2Off}
        title="This link doesn't work"
        footer={<BackToSignInLink />}
      >
        <RequestNewLink />
      </AuthPageLayout>
    );

  return (
    <AuthPageLayout title="Set a new password" footer={<BackToSignInLink />}>
      <FormProblem problem={problem} />
      {isLinkSpent ? (
        <RequestNewLink />
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <AuthField
            label="New password"
            hint={`${PASSWORD_MIN_LENGTH}+ characters`}
            error={fieldError}
          >
            {(control) => (
              <PasswordInput
                {...control}
                label="New password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </AuthField>
          <AuthSubmitButton busy={busy}>Save password</AuthSubmitButton>
        </form>
      )}
    </AuthPageLayout>
  );
};
