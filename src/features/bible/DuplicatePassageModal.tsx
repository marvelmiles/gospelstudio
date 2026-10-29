import { CopyPlus, RefreshCw } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";

interface DuplicatePassageModalProps {
  existingTitle: string | null;
  onOverwrite: () => void;
  onSaveCopy: () => void;
  onClose: () => void;
}

export const DuplicatePassageModal = ({
  existingTitle,
  onOverwrite,
  onSaveCopy,
  onClose,
}: DuplicatePassageModalProps) => {
  if (!existingTitle) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Passage already saved"
      width={480}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onSaveCopy}>
            <CopyPlus size={15} />
            Save as copy
          </Button>
          <Button onClick={onOverwrite}>
            <RefreshCw size={15} />
            Overwrite existing
          </Button>
        </>
      }
    >
      <p className="mt-0 text-[13.5px] leading-[1.65] text-foreground">
        "{existingTitle}" is already in your saved passages, but the saved one
        doesn't match what you're saving now.
      </p>
      <p className="m-0 text-[13px] leading-[1.65] text-muted-foreground">
        Overwrite it with this new content, or keep both; the new one is saved
        as a numbered copy like "{existingTitle} (1)".
      </p>
    </Modal>
  );
};
