import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import { forgotPasswordRequestSchema } from "@/contracts/authContract";
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

export const ForgotPasswordPage = () => {
  useDocumentTitle("Forgot password");
  const { busy, problem, submit } = useSubmission();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = checkForm(forgotPasswordRequestSchema, { email });
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    const sent = await submit(() => requestPasswordReset(check.data));
    if (sent) setSentTo(check.data.email);
  };

  if (sentTo)
    return (
      <AuthPageLayout
        icon={MailCheck}
        title="Check your email"
        description={`If an account uses ${sentTo}, a link to choose a new password is on its way. It works once, for a short time. Check your spam folder if it doesn't arrive in a few minutes.`}
      >
        <Button asChild variant="secondary" className="w-full">
          <Link to={routes.signIn()}>
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
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
      <OfflineNotice message="You're offline. Ask for a reset link once you're back online." />
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
