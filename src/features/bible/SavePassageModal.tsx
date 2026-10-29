import { useValueChange } from "@/hooks/useValueChange";
import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import type { ScriptureSelection } from "../../store/useStore";
import { Modal } from "@/components/shared/Modal";
import { InfoTip } from "@/components/shared/InfoTip";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { SwitchField } from "@/components/shared/SwitchField";
import { formatReference } from "./lib/reference";

interface SavePassageModalProps {
  selection: ScriptureSelection | null;
  onClose: () => void;
  onSave: (
    versesPerSlide: number,
    showVerseNumbers: boolean,
    showReference: boolean,
  ) => void;
}

export const SavePassageModal = ({
  selection,
  onClose,
  onSave,
}: SavePassageModalProps) => {
  const [versesPerSlide, setVersesPerSlide] = useState(1);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [showReference, setShowReference] = useState(true);

  useValueChange(selection, (next) => {
    if (!next) return;
    setVersesPerSlide(1);
    setShowVerseNumbers(true);
    setShowReference(true);
  });

  if (!selection) return null;
  const slideCount = Math.ceil(
    selection.verses.length / Math.max(1, versesPerSlide),
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={`Save ${formatReference(selection.range, selection.version)}`}
      width={480}
      info={
        <InfoTip title="Saving a passage">
          The passage is turned into presentation slides. You can restyle it,
          change backgrounds and re-chunk verses any time in the passage editor.
        </InfoTip>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave(versesPerSlide, showVerseNumbers, showReference)
            }
          >
            <BookmarkPlus size={15} />
            Save passage
          </Button>
        </>
      }
    >
      <Field
        label={`Verses per slide (${versesPerSlide}), makes ${slideCount} slide${slideCount === 1 ? "" : "s"}`}
      >
        <RangeSlider
          value={versesPerSlide}
          min={1}
          max={6}
          onValueChange={(next) => setVersesPerSlide(next)}
        />
      </Field>
      <div className="mb-2.5">
        <SwitchField
          label="Show verse numbers"
          checked={showVerseNumbers}
          onChange={setShowVerseNumbers}
        />
      </div>
      <SwitchField
        label="Show reference on each slide"
        checked={showReference}
        onChange={setShowReference}
      />
    </Modal>
  );
};
