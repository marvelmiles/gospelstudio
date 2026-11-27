import { useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { forgotPasswordRequestSchema } from "@/contracts/authContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSubmission } from "../../../hooks/useSubmission";
import { checkForm, type FieldErrors } from "../../../lib/formErrors";
import routes from "../../../routes";
import { useStore } from "../../../store/useStore";
import { requestPasswordReset } from "../api/authApi";
import {
  AuthActionButton,
  AuthLinkButton,
  AuthSubmitButton,
} from "../components/AuthButtons";
import { AuthField } from "../components/AuthField";
import { BackToSignInLink } from "../components/AuthLink";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { FormProblem } from "../components/FormProblem";
import { emailFromForgotPasswordState } from "../lib/forgotPasswordState";

export const ForgotPasswordPage = () => {
  useDocumentTitle("Forgot password");
  const location = useLocation();
  const pushToast = useStore((state) => state.pushToast);
  const { busy, problem, submit, clearProblem } = useSubmission();
  const [email, setEmail] = useState(() =>
    emailFromForgotPasswordState(location.state),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sentTo, setSentTo] = useState<string | null>(null);

  const sendLink = (address: string) =>
    submit(() => requestPasswordReset({ email: address }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = checkForm(forgotPasswordRequestSchema, { email });
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    if (await sendLink(check.data.email)) setSentTo(check.data.email);
  };

  const handleResend = async () => {
    if (sentTo && (await sendLink(sentTo)))
      pushToast("New link sent. Use the latest email.");
  };

  const handleUseAnotherEmail = () => {
    clearProblem();
    setSentTo(null);
  };

  if (sentTo)
    return (
      <AuthPageLayout
        icon={MailCheck}
        title="Check your email"
        description={
          <>
            If an account uses{" "}
            <strong className="font-semibold wrap-anywhere text-foreground">
              {sentTo}
            </strong>
            , a reset link is on its way.
          </>
        }
        footer={
          <Button
            variant="link"
            className="h-auto p-0 text-[13px] has-[>svg]:px-0"
            onClick={handleUseAnotherEmail}
          >
            Use a different email
          </Button>
        }
      >
        <FormProblem problem={problem} />
        <AuthLinkButton to={routes.signIn()}>Back to sign in</AuthLinkButton>
        <AuthActionButton busy={busy} onClick={() => void handleResend()}>
          Resend link
        </AuthActionButton>
      </AuthPageLayout>
    );

  return (
    <AuthPageLayout
      title="Reset your password"
      description="We'll email you a link to set a new one."
      footer={<BackToSignInLink />}
    >
      <FormProblem problem={problem} />
      <form onSubmit={handleSubmit} noValidate>
        <AuthField label="Email" error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </AuthField>
        <AuthSubmitButton busy={busy}>Send reset link</AuthSubmitButton>
      </form>
    </AuthPageLayout>
  );
};
