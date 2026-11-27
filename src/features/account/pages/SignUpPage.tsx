import { useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { PASSWORD_MIN_LENGTH } from "@/contracts/accountContract";
import { signUpRequestSchema } from "@/contracts/authContract";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSubmission } from "../../../hooks/useSubmission";
import { checkForm, type FieldErrors } from "../../../lib/formErrors";
import routes from "../../../routes";
import { signUp } from "../api/authApi";
import { completeSignIn } from "../accountLifecycle";
import { AuthSubmitButton } from "../components/AuthButtons";
import { AuthField } from "../components/AuthField";
import { AuthLink } from "../components/AuthLink";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { FormProblem } from "../components/FormProblem";
import { useNextPage } from "../hooks/useNextPage";
import { sessionDeviceName } from "../lib/sessionDeviceName";
import { useAuthStore } from "../session/authStore";

const signUpFormSchema = signUpRequestSchema.pick({
  churchName: true,
  email: true,
  password: true,
});

interface SignUpValues {
  churchName: string;
  email: string;
  password: string;
}

export const SignUpPage = () => {
  useDocumentTitle("Create an account");
  const status = useAuthStore((state) => state.status);
  const nextPage = useNextPage();
  const { busy, problem, submit } = useSubmission();
  const [values, setValues] = useState<SignUpValues>({
    churchName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  if (status === "signedIn") return <Navigate to={nextPage} replace />;

  const update =
    (field: keyof SignUpValues) => (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = checkForm(signUpFormSchema, values);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    await submit(async () => {
      const session = await signUp({
        ...check.data,
        deviceName: await sessionDeviceName(),
      });
      await completeSignIn(session);
    });
  };

  return (
    <AuthPageLayout
      title="Create your account"
      description="Sync your library across devices."
      footer={
        <>
          <span>Have an account?</span>
          <AuthLink to={routes.signIn(nextPage)}>Sign in</AuthLink>
        </>
      }
    >
      <FormProblem problem={problem} />
      <form onSubmit={handleSubmit} noValidate>
        <AuthField label="Church or ministry name" error={errors.churchName}>
          {(control) => (
            <Input
              {...control}
              autoComplete="organization"
              value={values.churchName}
              onChange={update("churchName")}
            />
          )}
        </AuthField>
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
          hint={`${PASSWORD_MIN_LENGTH}+ characters`}
          error={errors.password}
        >
          {(control) => (
            <PasswordInput
              {...control}
              label="Password"
              autoComplete="new-password"
              value={values.password}
              onChange={update("password")}
            />
          )}
        </AuthField>
        <AuthSubmitButton busy={busy}>Create account</AuthSubmitButton>
      </form>
    </AuthPageLayout>
  );
};
