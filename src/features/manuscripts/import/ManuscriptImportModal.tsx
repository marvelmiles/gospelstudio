import { useEffect } from "react";
import { Import, RotateCcw } from "lucide-react";
import { formatCountLabel } from "../../../lib/formatNumber";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/shared/InfoTip";
import { Modal } from "@/components/shared/Modal";
import { ProgressBar } from "@/components/shared/ProgressBar";
import type { ImportFile } from "./importFiles";
import { ImportReview } from "./ImportReview";
import { ImportSourcePicker } from "./ImportSourcePicker";
import {
  useManuscriptImport,
  type ImportProgress,
} from "./useManuscriptImport";

interface ManuscriptImportModalProps {
  onClose: () => void;
  initialFiles?: ImportFile[];
}

const ReadingProgress = ({ progress }: { progress: ImportProgress }) => (
  <div className="py-4">
    <ProgressBar
      value={progress.total ? (progress.done / progress.total) * 100 : 0}
      label={`Reading file ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`}
    />
    <p
      className="mt-2 mb-0 truncate text-[12px] text-subtle-foreground"
      title={progress.current}
    >
      {progress.current}
    </p>
  </div>
);

const ImportGuide = () => (
  <InfoTip title="How importing works">
    Files are read on this device and never uploaded. A title comes from a
    heading in the text, such as a capitalised line above verse 1 or{" "}
    <code>SONG: Way Maker</code>, and otherwise from the file name. A file
    holding several songs or sermons is split wherever a new title or a fresh
    verse 1 begins. Text already in your library is left out.
  </InfoTip>
);

export const ManuscriptImportModal = ({
  onClose,
  initialFiles,
}: ManuscriptImportModalProps) => {
  const importer = useManuscriptImport();
  const { read, cancel } = importer;

  useEffect(() => {
    if (!initialFiles?.length) return;
    void read(initialFiles, "files");
    return cancel;
  }, [initialFiles, read, cancel]);

  useEffect(() => cancel, [cancel]);

  const finish = () => {
    if (importer.commit()) onClose();
  };

  const footer =
    importer.step === "review" ? (
      <>
        <Button variant="secondary" onClick={importer.restart}>
          <RotateCcw size={15} />
          Choose other files
        </Button>
        {importer.drafts.length > 0 && (
          <Button onClick={finish}>
            <Import size={15} />
            Import {formatCountLabel(importer.drafts.length, "manuscript")}
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <Modal
      open
      onClose={onClose}
      title="Import manuscripts"
      width={680}
      info={<ImportGuide />}
      footer={footer}
    >
      {importer.step === "choose" && <ImportSourcePicker onFiles={read} />}
      {importer.step === "reading" && (
        <ReadingProgress progress={importer.progress} />
      )}
      {importer.step === "review" && (
        <ImportReview
          drafts={importer.drafts}
          skipped={importer.skipped}
          batchId={importer.batchId}
          onChange={importer.updateDraft}
          onRemove={importer.removeDraft}
        />
      )}
    </Modal>
  );
};
