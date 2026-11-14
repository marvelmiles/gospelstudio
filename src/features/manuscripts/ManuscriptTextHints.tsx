import { useDeferredValue, useMemo, type ReactNode } from "react";
import { Import, Info } from "lucide-react";
import type { ManuscriptFormat } from "../../types";
import { detectManuscriptFormat } from "../../lib/manuscript/detectFormat";
import { splitManuscriptPieces } from "../../lib/manuscript/pieces";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { importFileFromText, type ImportFile } from "./import/importFiles";
import type { OpenedManuscriptFile } from "./useManuscriptFileReader";

const MIN_LINES_FOR_FORMAT_HINT = 3;

const FORMAT_NAMES: Record<ManuscriptFormat, string> = {
  song: "Song",
  sermon: "Sermon",
};

interface HintProps {
  message: string;
  action: ReactNode;
}

const Hint = ({ message, action }: HintProps) => (
  <Alert variant="info" role="status" className="mb-3">
    <Info />
    <AlertDescription className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[12.5px] leading-normal text-current">
      <span className="min-w-0 flex-[1_1_220px]">{message}</span>
      {action}
    </AlertDescription>
  </Alert>
);

interface ManuscriptTextHintsProps {
  body: string;
  format: ManuscriptFormat;
  openedFile: OpenedManuscriptFile | null;
  textName: string;
  onFormatChange: (format: ManuscriptFormat) => void;
  onImport: (files: ImportFile[]) => void;
}

export const ManuscriptTextHints = ({
  body,
  format,
  openedFile,
  textName,
  onFormatChange,
  onImport,
}: ManuscriptTextHintsProps) => {
  const text = useDeferredValue(body);
  const pieceCount = useMemo(() => splitManuscriptPieces(text).length, [text]);
  const readsAs = useMemo(() => {
    const lines = text.split("\n");
    const filled = lines.filter((line) => line.trim()).length;
    return filled >= MIN_LINES_FOR_FORMAT_HINT
      ? detectManuscriptFormat(lines)
      : format;
  }, [text, format]);

  if (openedFile && openedFile.pieceCount > 1)
    return (
      <Hint
        message={`"${openedFile.file.name}" holds ${openedFile.pieceCount} songs or sermons. Only the first, "${openedFile.first.title}", is loaded here.`}
        action={
          <Button
            size="sm"
            onClick={() =>
              onImport([{ file: openedFile.file, path: openedFile.file.name }])
            }
          >
            <Import />
            Import all {openedFile.pieceCount}
          </Button>
        }
      />
    );

  if (pieceCount > 1)
    return (
      <Hint
        message={`This text holds ${pieceCount} songs or sermons. Each can be its own manuscript.`}
        action={
          <Button
            size="sm"
            onClick={() => onImport([importFileFromText(body, textName)])}
          >
            <Import />
            Import as {pieceCount} manuscripts
          </Button>
        }
      />
    );

  if (readsAs !== format)
    return (
      <Hint
        message={`This text reads like a ${FORMAT_NAMES[readsAs].toLowerCase()}.`}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onFormatChange(readsAs)}
          >
            Use {FORMAT_NAMES[readsAs]} format
          </Button>
        }
      />
    );

  return null;
};
