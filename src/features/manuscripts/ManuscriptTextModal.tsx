import { useValueChange } from "@/hooks/useValueChange";
import { useMemo, useRef, useState } from "react";
import { FileUp, Info, RefreshCw } from "lucide-react";
import type { Manuscript, ManuscriptFormat, Theme } from "../../types";
import { useTextFormatting } from "../../hooks/useTextFormatting";
import { useCompactScreen } from "../../hooks/useCompactScreen";
import { resolveStyle } from "../../lib/resolve";
import { slideRowCapacity, slideTextMetrics } from "../../lib/slideLayout";
import { DOCUMENT_FILE_ACCEPT } from "../../lib/documents/readDocumentText";
import {
  DEFAULT_MANUSCRIPT_FORMAT,
  MANUSCRIPT_FORMAT_OPTIONS,
  MANUSCRIPT_LINE_RANGE,
  clampManuscriptLines,
} from "../../lib/manuscript/format";
import { isUntitledManuscript } from "../../lib/manuscript/newManuscript";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Field } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { Modal } from "@/components/shared/Modal";
import { ManuscriptFormatGuideModal } from "./ManuscriptFormatGuideModal";
import { ManuscriptTextHints } from "./ManuscriptTextHints";
import { ManuscriptImportModal } from "./import/ManuscriptImportModal";
import type { ImportFile } from "./import/importFiles";
import {
  useManuscriptFileReader,
  type OpenedManuscriptFile,
} from "./useManuscriptFileReader";
import { Textarea } from "@/components/ui/textarea";

const PASTED_TEXT_NAME = "Pasted text";

interface ManuscriptTextModalProps {
  open: boolean;
  onClose: () => void;
  manuscript: Manuscript;
  theme: Theme;
  onRegenerate: (
    body: string,
    maxLines: number,
    format: ManuscriptFormat,
    sourceTitle?: string,
  ) => void;
}

export const ManuscriptTextModal = ({
  open,
  onClose,
  manuscript,
  theme,
  onRegenerate,
}: ManuscriptTextModalProps) => {
  const style = useMemo(
    () => resolveStyle(undefined, manuscript, theme),
    [manuscript, theme],
  );
  const fittedLines = slideRowCapacity(slideTextMetrics(style));
  const compact = useCompactScreen();
  const readFile = useManuscriptFileReader(style);
  const fileInput = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState(manuscript.body);
  const [format, setFormat] = useState<ManuscriptFormat>(
    manuscript.format ?? DEFAULT_MANUSCRIPT_FORMAT,
  );
  const [guideOpen, setGuideOpen] = useState(false);
  const [maxLines, setMaxLines] = useState(manuscript.maxLines || fittedLines);
  const [openedFile, setOpenedFile] = useState<OpenedManuscriptFile | null>(
    null,
  );
  const [readingFile, setReadingFile] = useState(false);
  const [importFiles, setImportFiles] = useState<ImportFile[] | null>(null);
  const { bind: bindFormatting, ...formatting } = useTextFormatting({
    value: body,
    onChange: setBody,
  });
  const isSermon = format === "sermon";

  useValueChange(open ? manuscript : null, (opened) => {
    if (!opened) return;
    const openedFormat = opened.format ?? DEFAULT_MANUSCRIPT_FORMAT;
    setBody(opened.body);
    setFormat(openedFormat);
    setMaxLines(
      clampManuscriptLines(opened.maxLines || fittedLines, openedFormat),
    );
    setOpenedFile(null);
  });

  const changeFormat = (next: ManuscriptFormat) => {
    setFormat(next);
    setMaxLines((lines) => clampManuscriptLines(lines, next));
  };

  const openFile = async (file: File) => {
    setReadingFile(true);
    const opened = await readFile(file);
    setReadingFile(false);
    if (!opened) return;
    setOpenedFile(opened);
    setBody(opened.first.body);
    changeFormat(opened.first.format);
  };

  const regenerate = () => {
    onRegenerate(body, maxLines, format, openedFile?.first.title);
    onClose();
  };

  const textName = isUntitledManuscript(manuscript.title)
    ? PASTED_TEXT_NAME
    : manuscript.title;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Manuscript Text"
      width={640}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={regenerate}>
            <RefreshCw size={15} />
            Regenerate slides
          </Button>
        </>
      }
    >
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Format type">
            <OptionSelect
              value={format}
              options={MANUSCRIPT_FORMAT_OPTIONS}
              onValueChange={(next) => changeFormat(next as ManuscriptFormat)}
            />
          </Field>
        </div>
        <div className="mb-4 flex gap-2">
          {compact ? (
            <IconButton
              icon={FileUp}
              title="Open a file"
              filled
              disabled={readingFile}
              onClick={() => fileInput.current?.click()}
            />
          ) : (
            <Button
              variant="secondary"
              busy={readingFile}
              onClick={() => fileInput.current?.click()}
            >
              <FileUp size={15} />
              Open file
            </Button>
          )}
          <IconButton
            icon={Info}
            title="How the text is read"
            filled
            onClick={() => setGuideOpen(true)}
          />
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={DOCUMENT_FILE_ACCEPT}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void openFile(file);
          event.target.value = "";
        }}
      />
      <ManuscriptTextHints
        body={body}
        format={format}
        openedFile={openedFile}
        textName={textName}
        onFormatChange={changeFormat}
        onImport={setImportFiles}
      />
      <Textarea
        ref={bindFormatting}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onSelect={formatting.syncSelection}
        onKeyUp={formatting.syncSelection}
        onClick={formatting.syncSelection}
        onKeyDown={formatting.handleKeyDown}
        className="min-h-80 resize-y font-mono text-[13.5px] leading-[1.65]"
      />
      <div className="mt-3">
        <Field
          label={
            isSermon
              ? "Lines of text per slide, roughly"
              : "Max lines per slide"
          }
        >
          <RangeSlider
            aria-label={isSermon ? "Lines per slide" : "Max lines per slide"}
            value={maxLines}
            min={MANUSCRIPT_LINE_RANGE[format].min}
            max={MANUSCRIPT_LINE_RANGE[format].max}
            onValueChange={(next) => setMaxLines(next)}
          />
        </Field>
        <p className="mx-0 -mt-1.5 mb-0 text-[11.5px] leading-[1.55] text-subtle-foreground">
          At this manuscript's text size a slide shows about {fittedLines} line
          {fittedLines === 1 ? "" : "s"} and still keeps its space top and
          bottom. Anything longer moves onto the next slide.
        </p>
      </div>
      {guideOpen && (
        <ManuscriptFormatGuideModal
          open
          onClose={() => setGuideOpen(false)}
          format={format}
        />
      )}
      {importFiles && (
        <ManuscriptImportModal
          initialFiles={importFiles}
          onClose={() => setImportFiles(null)}
        />
      )}
    </Modal>
  );
};
