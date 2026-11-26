import { useState, type ChangeEvent, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { changePasswordRequestSchema } from "@/contracts/accountContract";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/Field";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useSubmission } from "../../../hooks/useSubmission";
import { checkForm, type FieldErrors } from "../../../lib/formErrors";
import { useStore } from "../../../store/useStore";
import { changePassword } from "../api/accountApi";
import { FormProblem } from "./FormProblem";

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
}

const EMPTY_VALUES: PasswordValues = { currentPassword: "", newPassword: "" };

export const PasswordSection = () => {
  const pushToast = useStore((state) => state.pushToast);
  const { busy, problem, submit } = useSubmission();
  const [values, setValues] = useState<PasswordValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});

  const update =
    (field: keyof PasswordValues) => (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const check = checkForm(changePasswordRequestSchema, values);
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    const changed = await submit(() => changePassword(check.data));
    if (!changed) return;
    setValues(EMPTY_VALUES);
    pushToast("Password changed. Your other devices were signed out.");
  };

  return (
    <Panel>
      <PanelTitle
        title="Password"
        icon={KeyRound}
        info="Changing your password signs out every other device. This device stays signed in."
      />
      <FormProblem problem={problem} />
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Current password" error={errors.currentPassword ?? null}>
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={update("currentPassword")}
            aria-invalid={Boolean(errors.currentPassword)}
          />
        </Field>
        <Field label="New password" error={errors.newPassword ?? null}>
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={update("newPassword")}
            aria-invalid={Boolean(errors.newPassword)}
          />
        </Field>
        <Button type="submit" variant="secondary" busy={busy}>
          Change password
        </Button>
      </form>
    </Panel>
  );
};
