import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { Background } from "../../types";
import { useStore } from "../../store/useStore";
import { validateName } from "../../lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { Modal } from "@/components/shared/Modal";
import { BgSwatch } from "../../components/controls/BgSwatch";

const FORM_ID = "rename-background-form";

interface RenameBackgroundModalProps {
  background: Background;
  onClose: () => void;
}

export const RenameBackgroundModal = ({
  background,
  onClose,
}: RenameBackgroundModalProps) => {
  const updateBackground = useStore((s) => s.updateBackground);
  const pushToast = useStore((s) => s.pushToast);
  const [name, setName] = useState(background.name);
  const [touched, setTouched] = useState(false);

  const error = validateName(name, "name");

  const save = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (error) return;
    updateBackground(background.id, { name: name.trim() });
    pushToast("Background saved.");
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Background"
      width={460}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID}>
            <Save size={15} />
            Save
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={save} noValidate>
        <BgSwatch
          bg={background}
          className="mb-4 aspect-video rounded-xl border border-border"
        />
        <Field label="Name" error={touched ? error : null}>
          <Input
            value={name}
            autoFocus
            aria-invalid={touched && Boolean(error)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
};
