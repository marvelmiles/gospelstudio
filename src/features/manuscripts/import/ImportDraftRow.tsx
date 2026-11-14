import { memo } from "react";
import { BookOpen, Music, X } from "lucide-react";
import { COLLECTIONS, isCollection } from "../../../data/collections";
import { formatCountLabel } from "../../../lib/formatNumber";
import {
  titleFromFileName,
  type ManuscriptDraft,
} from "../../../lib/manuscript/importDrafts";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/shared/IconButton";
import { OptionSelect } from "@/components/shared/OptionSelect";
import type { DraftChanges } from "./useManuscriptImport";

const COLLECTION_OPTIONS = [...COLLECTIONS];

interface ImportDraftRowProps {
  draft: ManuscriptDraft;
  onChange: (key: string, changes: DraftChanges) => void;
  onRemove: (key: string) => void;
}

const ImportDraftRowView = ({
  draft,
  onChange,
  onRemove,
}: ImportDraftRowProps) => {
  const FormatIcon = draft.format === "sermon" ? BookOpen : Music;

  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl border border-border bg-secondary/40 p-2.5">
      <div
        className="mt-0.5 grid size-8.5 shrink-0 place-items-center rounded-lg bg-primary/14 text-primary-soft"
        title={draft.format === "sermon" ? "Sermon" : "Song"}
      >
        <FormatIcon size={16} />
      </div>
      <div className="min-w-0 flex-[1_1_200px]">
        <Input
          value={draft.title}
          placeholder={titleFromFileName(draft.sourceName)}
          aria-label="Title"
          onChange={(event) =>
            onChange(draft.key, { title: event.target.value })
          }
        />
        <p
          className="mt-1 mb-0 truncate text-[11.5px] text-subtle-foreground"
          title={draft.sourceName}
        >
          {formatCountLabel(draft.slides.length, "slide")} from{" "}
          {draft.sourceName}
        </p>
      </div>
      <div className="flex min-w-0 flex-[1_1_150px] items-center gap-1.5">
        <OptionSelect
          value={draft.collection}
          options={COLLECTION_OPTIONS}
          aria-label="Collection"
          className="min-w-0"
          onValueChange={(next) => {
            if (isCollection(next)) onChange(draft.key, { collection: next });
          }}
        />
        <IconButton
          icon={X}
          title={`Leave out "${draft.title}"`}
          onClick={() => onRemove(draft.key)}
        />
      </div>
    </li>
  );
};

export const ImportDraftRow = memo(ImportDraftRowView);
