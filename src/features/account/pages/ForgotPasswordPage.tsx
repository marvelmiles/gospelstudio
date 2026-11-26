import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, KeyRound, MailCheck, RotateCw } from "lucide-react";
import { forgotPasswordRequestSchema } from "@/contracts/authContract";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSubmission } from "../../../hooks/useSubmission";
import { checkForm, type FieldErrors } from "../../../lib/formErrors";
import routes from "../../../routes";
import { requestPasswordReset } from "../api/authApi";
import { AuthLink } from "../components/AuthLink";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { FormProblem } from "../components/FormProblem";
import { OfflineNotice } from "../components/OfflineNotice";
import { emailFromForgotPasswordState } from "../lib/forgotPasswordState";

const OFFLINE_MESSAGE =
  "You're offline. Ask for a reset link once you're back online.";

export const ForgotPasswordPage = () => {
  useDocumentTitle("Forgot password");
  const location = useLocation();
  const { busy, problem, submit, clearProblem } = useSubmission();
  const [email, setEmail] = useState(() =>
    emailFromForgotPasswordState(location.state),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);

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
    if (await sendLink(check.data.email)) {
      setSentTo(check.data.email);
      setResendCount(0);
    }
  };

  const handleResend = async () => {
    if (sentTo && (await sendLink(sentTo)))
      setResendCount((count) => count + 1);
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
            , we sent it a link to choose a new password. The link works once,
            for a short time.
          </>
        }
        footer={
          <>
            <span>Wrong email?</span>
            <Button
              variant="link"
              className="h-auto p-0 text-[13px] has-[>svg]:px-0"
              onClick={handleUseAnotherEmail}
            >
              Use a different one
            </Button>
          </>
        }
      >
        <OfflineNotice message={OFFLINE_MESSAGE} />
        <FormProblem problem={problem} />
        {resendCount > 0 && !problem && (
          <Alert variant="info" className="mb-3.5">
            <MailCheck aria-hidden />
            <AlertDescription className="text-[13px]">
              We sent another link. Use the one in the newest email.
            </AlertDescription>
          </Alert>
        )}
        {!problem && (
          <p className="mt-0 mb-4 text-center text-[13px] leading-relaxed text-muted-foreground">
            Not there after a few minutes? Check your spam or junk folder, then
            send it again.
          </p>
        )}
        <Button asChild className="w-full">
          <Link to={routes.signIn()}>
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="mt-2 w-full"
          busy={busy}
          onClick={() => void handleResend()}
        >
          <RotateCw size={15} />
          Send the link again
        </Button>
      </AuthPageLayout>
    );

  return (
    <AuthPageLayout
      icon={KeyRound}
      title="Forgot your password?"
      description="Enter the email you sign in with and we'll send you a link to choose a new password."
      footer={
        <>
          <span>Remembered it?</span>
          <AuthLink to={routes.signIn()}>Sign in</AuthLink>
        </>
      }
    >
      <OfflineNotice message={OFFLINE_MESSAGE} />
      <FormProblem problem={problem} />
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email" error={errors.email ?? null}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Button type="submit" className="mt-1 w-full" busy={busy}>
          Send reset link
        </Button>
      </form>
    </AuthPageLayout>
  );
};
