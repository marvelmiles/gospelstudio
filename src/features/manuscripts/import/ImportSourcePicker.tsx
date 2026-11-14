import { useRef, useState, type DragEvent } from "react";
import { Files, FolderOpen, FolderInput } from "lucide-react";
import type { ManuscriptImportSource } from "../../../lib/analytics/analyticsEvents";
import { DOCUMENT_FILE_ACCEPT } from "../../../lib/documents/readDocumentText";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import {
  importFilesFromDrop,
  importFilesFromList,
  type ImportFile,
} from "./importFiles";
import { SUPPORTED_FORMATS_LABEL } from "./importLabels";

const FOLDER_PICKING_SUPPORTED =
  typeof HTMLInputElement !== "undefined" &&
  "webkitdirectory" in HTMLInputElement.prototype;

interface ImportSourcePickerProps {
  onFiles: (files: ImportFile[], source: ManuscriptImportSource) => void;
}

export const ImportSourcePicker = ({ onFiles }: ImportSourcePickerProps) => {
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const attachFolderInput = (node: HTMLInputElement | null) => {
    folderInput.current = node;
    node?.setAttribute("webkitdirectory", "");
  };

  const pick = (list: FileList | null, source: ManuscriptImportSource) => {
    const files = importFilesFromList(list ?? []);
    if (files.length) onFiles(files, source);
  };

  const dragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  };

  const dragLeave = (event: DragEvent<HTMLDivElement>) => {
    const next =
      event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (!event.currentTarget.contains(next)) setDragging(false);
  };

  const drop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = await importFilesFromDrop(event.dataTransfer);
    if (dropped.files.length)
      onFiles(dropped.files, dropped.includesFolder ? "folder" : "files");
  };

  return (
    <div
      onDragOver={dragOver}
      onDragLeave={dragLeave}
      onDrop={drop}
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center transition-colors sm:py-10",
        dragging && "border-primary bg-primary/8",
      )}
    >
      <div className="grid size-12 place-items-center rounded-xl bg-primary/14 text-primary-soft">
        <FolderInput size={22} />
      </div>
      <div className="min-w-0">
        <p className="m-0 text-[15px] font-semibold text-foreground">
          Drop files or a folder here
        </p>
        <p className="mx-auto mt-1.5 mb-0 max-w-[46ch] text-[12.5px] leading-[1.6] text-muted-foreground">
          Every song, hymn or sermon found becomes its own manuscript, even when
          one file holds several.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        <Button onClick={() => filesInput.current?.click()}>
          <Files size={15} />
          Choose files
        </Button>
        {FOLDER_PICKING_SUPPORTED && (
          <Button
            variant="secondary"
            onClick={() => folderInput.current?.click()}
          >
            <FolderOpen size={15} />
            Choose a folder
          </Button>
        )}
      </div>
      <p className="m-0 text-[11.5px] text-subtle-foreground">
        Reads {SUPPORTED_FORMATS_LABEL} files
      </p>
      <input
        ref={filesInput}
        type="file"
        accept={DOCUMENT_FILE_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          pick(event.target.files, "files");
          event.target.value = "";
        }}
      />
      <input
        ref={attachFolderInput}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          pick(event.target.files, "folder");
          event.target.value = "";
        }}
      />
    </div>
  );
};
