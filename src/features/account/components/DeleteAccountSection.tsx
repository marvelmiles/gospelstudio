import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { currentPasswordSchema } from "@/contracts/accountContract";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Field } from "@/components/shared/Field";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { useSubmission } from "../../../hooks/useSubmission";
import routes from "../../../routes";
import { useStore } from "../../../store/useStore";
import { deleteAccount } from "../api/accountApi";
import { finishAccountDeletion } from "../accountLifecycle";
import { FormProblem } from "./FormProblem";

export const DeleteAccountSection = () => {
  const navigate = useNavigate();
  const pushToast = useStore((state) => state.pushToast);
  const { busy, problem, submit } = useSubmission();
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const askToConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = currentPasswordSchema.safeParse(password);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setFieldError(null);
    setIsConfirming(true);
  };

  const confirmDeletion = async () => {
    setIsConfirming(false);
    const deleted = await submit(async () => {
      await deleteAccount(password);
      await finishAccountDeletion();
    });
    if (!deleted) return;
    pushToast(
      "Your account was deleted. Everything on this device is still here.",
    );
    navigate(routes.dashboard(), { replace: true });
  };

  return (
    <Panel className="border-destructive/30">
      <PanelTitle title="Delete account" icon={Trash2} />
      <p className="mt-0 mb-3.5 text-[13px] leading-relaxed text-muted-foreground">
        This removes your account and everything synced to it. Your other
        devices are signed out and keep what is already on them. The library on
        this device stays here and keeps working offline.
      </p>
      <FormProblem problem={problem} />
      <form onSubmit={askToConfirm} noValidate>
        <Field label="Current password" error={fieldError}>
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldError)}
          />
        </Field>
        <Button type="submit" variant="destructive" busy={busy}>
          <Trash2 size={15} />
          Delete account
        </Button>
      </form>
      <ConfirmDialog
        open={isConfirming}
        title="Delete your account?"
        message="Your account and its synced library are removed for good. This can't be undone. The library on this device is not touched."
        confirmLabel="Delete account"
        onConfirm={() => void confirmDeletion()}
        onCancel={() => setIsConfirming(false)}
      />
    </Panel>
  );
};
