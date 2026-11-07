import { useState, type FormEvent } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { Field } from "@/components/shared/Field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AdminKeyFormProps {
  problem: string | null;
  onSubmit: (adminKey: string) => void;
}

export const AdminKeyForm = ({ problem, onSubmit }: AdminKeyFormProps) => {
  const [adminKey, setAdminKey] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = adminKey.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Panel className="mx-auto mt-6 max-w-110">
      <form onSubmit={submit} className="grid gap-1">
        <span className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/14 text-primary-soft">
          <ShieldCheck size={22} />
        </span>
        <h2 className="m-0 text-center text-lg font-semibold text-foreground">
          Analytics is for admins
        </h2>
        <p className="mt-1 mb-4 text-center text-[13.5px] leading-relaxed text-muted-foreground">
          Enter the admin key set as ANALYTICS_ADMIN_TOKEN on the server. It is
          kept in this tab only and forgotten when the tab closes.
        </p>
        <Field label="Admin key" error={problem}>
          <Input
            type="password"
            autoComplete="current-password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            aria-invalid={Boolean(problem)}
            required
          />
        </Field>
        <Button type="submit" disabled={!adminKey.trim()}>
          <KeyRound size={15} />
          Open analytics
        </Button>
      </form>
    </Panel>
  );
};
