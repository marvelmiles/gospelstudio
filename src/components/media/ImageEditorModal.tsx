import { useState } from "react";
import { Save, Undo2 } from "lucide-react";
import type { ImageSettings } from "../../types";
import { useBlobUrl } from "../../lib/blobUrls";
import { shallowEqual } from "../../lib/equality";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/Field";
import { Input } from "@/components/ui/input";
import { ImageLayer } from "../../components/media/ImageLayer";
import { ImageSettingsControls } from "./ImageSettingsControls";
import { InfoTip } from "@/components/shared/InfoTip";

interface ImageEditorModalProps {
  title: string;
  note?: string;
  blobId?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  initialName?: string;
  initialSettings: ImageSettings;
  defaults: ImageSettings;
  onSave: (settings: ImageSettings, name: string) => void;
  onClose: () => void;
}

export const ImageEditorModal = ({
  title,
  note,
  blobId,
  fallbackSrc,
  alt,
  initialName,
  initialSettings,
  defaults,
  onSave,
  onClose,
}: ImageEditorModalProps) => {
  const [name, setName] = useState(initialName ?? "");
  const [settings, setSettings] = useState<ImageSettings>(initialSettings);
  const blobUrl = useBlobUrl(blobId ?? null);

  const patch = (changes: Partial<ImageSettings>) =>
    setSettings((prev) => ({ ...prev, ...changes }));

  const canReset = !shallowEqual(settings, defaults);

  const save = () => {
    onSave(settings, name.trim());
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      width={760}
      info={
        note ? <InfoTip title="Where changes go">{note}</InfoTip> : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={!canReset}
            title={
              canReset
                ? "Put every adjustment back to the way this picture started"
                : "Nothing to reset: every adjustment is already where it started"
            }
            onClick={() => setSettings(defaults)}
          >
            <Undo2 size={14} />
            Reset all
          </Button>
          <Button onClick={save}>
            <Save size={15} />
            Save
          </Button>
        </>
      }
    >
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10">
        <ImageLayer
          src={blobUrl ?? fallbackSrc ?? null}
          alt={alt}
          settings={settings}
        />
      </div>

      {initialName !== undefined && (
        <div className="mt-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
      )}

      <ImageSettingsControls settings={settings} onChange={patch} />
    </Modal>
  );
};
