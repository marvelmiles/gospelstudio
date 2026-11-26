import { useState, type ChangeEvent, type FormEvent } from "react";
import { Mail } from "lucide-react";
import {
  changeEmailRequestSchema,
  type Account,
} from "@/contracts/accountContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useSubmission } from "../../../hooks/useSubmission";
import { checkForm, type FieldErrors } from "../../../lib/formErrors";
import { useStore } from "../../../store/useStore";
import { changeEmail } from "../api/accountApi";
import { rememberAccount } from "../session/sessionManager";
import { FormProblem } from "./FormProblem";

interface EmailSectionProps {
  account: Account;
}

interface EmailValues {
  email: string;
  currentPassword: string;
}

const EMPTY_VALUES: EmailValues = { email: "", currentPassword: "" };

export const EmailSection = ({ account }: EmailSectionProps) => {
  const pushToast = useStore((state) => state.pushToast);
  const { busy, problem, submit } = useSubmission();
  const [values, setValues] = useState<EmailValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});

  const update =
    (field: keyof EmailValues) => (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = checkForm(changeEmailRequestSchema, values);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    const changed = await submit(async () => {
      await rememberAccount(await changeEmail(check.data));
    });
    if (!changed) return;
    setValues(EMPTY_VALUES);
    pushToast(`You now sign in with ${check.data.email}.`);
  };

  return (
    <Panel>
      <PanelTitle
        title="Sign-in email"
        icon={Mail}
        info="Password reset links are sent to this address. A note about the change goes to your current address."
      />
      <p className="mt-0 mb-3.5 text-[13px] text-muted-foreground">
        You sign in with{" "}
        <span className="font-semibold text-foreground">{account.email}</span>.
      </p>
      <FormProblem problem={problem} />
      <form onSubmit={handleSubmit} noValidate>
        <Field label="New email" error={errors.email ?? null}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={update("email")}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Current password" error={errors.currentPassword ?? null}>
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={update("currentPassword")}
            aria-invalid={Boolean(errors.currentPassword)}
          />
        </Field>
        <Button type="submit" variant="secondary" busy={busy}>
          Change email
        </Button>
      </form>
    </Panel>
  );
};
