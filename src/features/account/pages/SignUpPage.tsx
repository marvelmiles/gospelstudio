import { useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { UserRoundPlus } from "lucide-react";
import { PASSWORD_MIN_LENGTH } from "@/contracts/accountContract";
import { signUpRequestSchema } from "@/contracts/authContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSubmission } from "../../../hooks/useSubmission";
import { checkForm, type FieldErrors } from "../../../lib/formErrors";
import routes from "../../../routes";
import { signUp } from "../api/authApi";
import { completeSignIn } from "../accountLifecycle";
import { AuthLink } from "../components/AuthLink";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { FormProblem } from "../components/FormProblem";
import { OfflineNotice } from "../components/OfflineNotice";
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
      icon={UserRoundPlus}
      title="Create an account"
      description="Keep your songs, Bible passages, media and Studio productions safe in one account. Everything still works offline on this device."
      footer={
        <>
          <span>Already have an account?</span>
          <AuthLink to={routes.signIn(nextPage)}>Sign in</AuthLink>
        </>
      }
    >
      <OfflineNotice message="You're offline. Keep working as usual, and create your account once you're back online." />
      <FormProblem problem={problem} />
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Church or ministry name"
          error={errors.churchName ?? null}
        >
          <Input
            autoComplete="organization"
            value={values.churchName}
            onChange={update("churchName")}
            aria-invalid={Boolean(errors.churchName)}
          />
        </Field>
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
            autoComplete="new-password"
            value={values.password}
            onChange={update("password")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby="sign-up-password-hint"
          />
          {!errors.password && (
            <span
              id="sign-up-password-hint"
              className="mt-1.5 block text-[11.5px] text-muted-foreground"
            >
              At least {PASSWORD_MIN_LENGTH} characters. A short sentence is
              easy to remember and hard to guess.
            </span>
          )}
        </Field>
        <Button type="submit" className="mt-1 w-full" busy={busy}>
          <UserRoundPlus size={15} />
          Create account
        </Button>
      </form>
    </AuthPageLayout>
  );
};
