import { useState } from "react";
import { useStore } from "../../store/useStore";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/Field";
import { Input } from "@/components/ui/input";
import { validateName } from "../../lib/validation";
import { suggestedPresetName } from "./lib/overlayPresets";
import type { StreamOverlay } from "./lib/streamOverlay";
import { linkStreamOverlayPreset } from "./lib/streamOverlayStore";

interface SaveOverlayDialogProps {
  overlay: StreamOverlay;
  onClose: () => void;
}

export const SaveOverlayDialog = ({
  overlay,
  onClose,
}: SaveOverlayDialogProps) => {
  const presets = useStore((s) => s.overlayPresets);
  const saveOverlayPreset = useStore((s) => s.saveOverlayPreset);
  const updateOverlayPreset = useStore((s) => s.updateOverlayPreset);
  const pushToast = useStore((s) => s.pushToast);
  const [name, setName] = useState(() => suggestedPresetName(overlay));
  const [showError, setShowError] = useState(false);

  const error = validateName(name, "name");
  const existing = presets.find(
    (preset) => preset.name.toLowerCase() === name.trim().toLowerCase(),
  );

  const save = () => {
    if (error) {
      setShowError(true);
      return;
    }
    if (existing) {
      updateOverlayPreset(existing.id, overlay);
      linkStreamOverlayPreset(overlay.id, existing.id);
      pushToast(`"${existing.name}" now matches this element.`);
    } else {
      const presetId = saveOverlayPreset(overlay, name);
      if (presetId) {
        linkStreamOverlayPreset(overlay.id, presetId);
        pushToast(`"${name.trim()}" saved. Changes to it are kept in step.`);
      }
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Save this overlay"
      width={430}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            {existing ? "Replace" : "Save overlay"}
          </Button>
        </>
      }
    >
      <p className="mt-0 mb-3.5 text-[13px] leading-[1.6] text-muted-foreground">
        Its placement, styling and what it is showing are kept together, and any
        change you make to it from now on is saved too. Add it to any broadcast
        later from Saved.
      </p>
      <Field label="Name" error={showError ? error : null}>
        <Input
          value={name}
          autoFocus
          aria-invalid={showError && Boolean(error)}
          placeholder="Welcome announcement"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
      </Field>
      {existing && (
        <p className="m-0 text-[12.5px] leading-[1.55] text-warning">
          A saved overlay already goes by this name. Saving replaces it.
        </p>
      )}
    </Modal>
  );
};
