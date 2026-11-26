import { useState, type FormEvent } from "react";
import { Church } from "lucide-react";
import { churchNameSchema, type Account } from "@/contracts/accountContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { useSubmission } from "../../../hooks/useSubmission";
import { useStore } from "../../../store/useStore";
import { renameChurch } from "../api/accountApi";
import { rememberAccount } from "../session/sessionManager";
import { FormProblem } from "./FormProblem";

interface ChurchNameSectionProps {
  account: Account;
}

export const ChurchNameSection = ({ account }: ChurchNameSectionProps) => {
  const pushToast = useStore((state) => state.pushToast);
  const { busy, problem, submit } = useSubmission();
  const [churchName, setChurchName] = useState(account.churchName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const isUnchanged = churchName.trim() === account.churchName;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = churchNameSchema.safeParse(churchName);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setFieldError(null);
    const saved = await submit(async () => {
      await rememberAccount(await renameChurch(parsed.data));
    });
    if (saved) pushToast("Church or ministry name saved.");
  };

  return (
    <Panel>
      <PanelTitle title="Church or ministry" icon={Church} />
      <FormProblem problem={problem} />
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Name" error={fieldError}>
          <Input
            autoComplete="organization"
            value={churchName}
            onChange={(event) => setChurchName(event.target.value)}
            aria-invalid={Boolean(fieldError)}
          />
        </Field>
        <Button
          type="submit"
          variant="secondary"
          busy={busy}
          disabled={isUnchanged}
        >
          Save name
        </Button>
      </form>
    </Panel>
  );
};
