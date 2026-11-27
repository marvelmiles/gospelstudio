import { useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { signInRequestSchema } from "@/contracts/authContract";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSubmission } from "../../../hooks/useSubmission";
import { checkForm, type FieldErrors } from "../../../lib/formErrors";
import routes from "../../../routes";
import { signIn } from "../api/authApi";
import { completeSignIn } from "../accountLifecycle";
import { AuthSubmitButton } from "../components/AuthButtons";
import { AuthField } from "../components/AuthField";
import { AuthLink } from "../components/AuthLink";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { FormProblem } from "../components/FormProblem";
import { useNextPage } from "../hooks/useNextPage";
import { forgotPasswordStateOf } from "../lib/forgotPasswordState";
import { sessionDeviceName } from "../lib/sessionDeviceName";
import { useAuthStore } from "../session/authStore";

const signInFormSchema = signInRequestSchema.pick({
  email: true,
  password: true,
});

interface SignInValues {
  email: string;
  password: string;
}

export const SignInPage = () => {
  useDocumentTitle("Sign in");
  const status = useAuthStore((state) => state.status);
  const nextPage = useNextPage();
  const { busy, problem, submit } = useSubmission();
  const [values, setValues] = useState<SignInValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  if (status === "signedIn") return <Navigate to={nextPage} replace />;

  const update =
    (field: keyof SignInValues) => (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = checkForm(signInFormSchema, values);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    await submit(async () => {
      const session = await signIn({
        ...check.data,
        deviceName: await sessionDeviceName(),
      });
      await completeSignIn(session);
    });
  };

  return (
    <AuthPageLayout
      title="Sign in"
      footer={
        <>
          <span>No account?</span>
          <AuthLink to={routes.signUp(nextPage)}>Create one</AuthLink>
        </>
      }
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
              value={values.email}
              onChange={update("email")}
            />
          )}
        </AuthField>
        <AuthField
          label="Password"
          error={errors.password}
          action={
            <span className="text-xs">
              <AuthLink
                to={routes.forgotPassword()}
                state={forgotPasswordStateOf(values.email)}
              >
                Forgot password?
              </AuthLink>
            </span>
          }
        >
          {(control) => (
            <PasswordInput
              {...control}
              label="Password"
              autoComplete="current-password"
              value={values.password}
              onChange={update("password")}
            />
          )}
        </AuthField>
        <AuthSubmitButton busy={busy}>Sign in</AuthSubmitButton>
      </form>
    </AuthPageLayout>
  );
};
