import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { validateName } from "../../../lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { Modal } from "@/components/shared/Modal";

const FORM_ID = "studio-name-form";

interface NameDialogProps {
  title: string;
  label: string;
  initialName: string;
  confirmLabel?: string;
  description?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export const NameDialog = ({
  title,
  label,
  initialName,
  confirmLabel = "Save",
  description,
  onSave,
  onClose,
}: NameDialogProps) => {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);
  const error = validateName(name, label.toLowerCase());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (error) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID}>
            <Check size={15} />
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate>
        {description && (
          <p className="mt-0 mb-3.5 text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        <Field label={label} error={touched ? error : null}>
          <Input
            value={name}
            autoFocus
            onFocus={(event) => event.target.select()}
            aria-invalid={touched && Boolean(error)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
};
