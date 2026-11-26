import { useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { signInRequestSchema } from "@/contracts/authContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSubmission } from "../../../hooks/useSubmission";
import { checkForm, type FieldErrors } from "../../../lib/formErrors";
import routes from "../../../routes";
import { signIn } from "../api/authApi";
import { completeSignIn } from "../accountLifecycle";
import { AuthLink } from "../components/AuthLink";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { FormProblem } from "../components/FormProblem";
import { OfflineNotice } from "../components/OfflineNotice";
import { useNextPage } from "../hooks/useNextPage";
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
      icon={LogIn}
      title="Sign in"
      description="Sign in to keep your church's library in your account and use it on every device."
      footer={
        <>
          <span>New here?</span>
          <AuthLink to={routes.signUp(nextPage)}>Create an account</AuthLink>
        </>
      }
    >
      <OfflineNotice message="You're offline. Keep working as usual, and sign in once you're back online." />
      <FormProblem problem={problem} />
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email" error={errors.email ?? null}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={update("email")}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Password" error={errors.password ?? null}>
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            value={values.password}
            onChange={update("password")}
            aria-invalid={Boolean(errors.password)}
          />
        </Field>
        <div className="-mt-1 mb-4 text-right text-[13px]">
          <AuthLink to={routes.forgotPassword()}>Forgot password?</AuthLink>
        </div>
        <Button type="submit" className="w-full" busy={busy}>
          <LogIn size={15} />
          Sign in
        </Button>
      </form>
    </AuthPageLayout>
  );
};
