import { useValueChange } from "@/hooks/useValueChange";
import { useState } from "react";
import { Info, RefreshCw } from "lucide-react";
import type { Manuscript, ManuscriptFormat, Theme } from "../../types";
import { useTextFormatting } from "../../hooks/useTextFormatting";
import { resolveStyle } from "../../lib/resolve";
import { slideRowCapacity, slideTextMetrics } from "../../lib/slideLayout";
import {
  DEFAULT_MANUSCRIPT_FORMAT,
  MANUSCRIPT_FORMAT_OPTIONS,
} from "../../lib/manuscript/format";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Field } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { Modal } from "@/components/shared/Modal";
import { ManuscriptFormatGuideModal } from "./ManuscriptFormatGuideModal";
import { Textarea } from "@/components/ui/textarea";

const LINE_RANGE: Record<ManuscriptFormat, { min: number; max: number }> = {
  song: { min: 2, max: 10 },
  sermon: { min: 4, max: 16 },
};

const clampLines = (value: number, format: ManuscriptFormat): number => {
  const { min, max } = LINE_RANGE[format];
  return Math.min(max, Math.max(min, value));
};

interface ManuscriptTextModalProps {
  open: boolean;
  onClose: () => void;
  manuscript: Manuscript;
  theme: Theme;
  onRegenerate: (
    body: string,
    maxLines: number,
    format: ManuscriptFormat,
  ) => void;
}

export const ManuscriptTextModal = ({
  open,
  onClose,
  manuscript,
  theme,
  onRegenerate,
}: ManuscriptTextModalProps) => {
  const fittedLines = slideRowCapacity(
    slideTextMetrics(resolveStyle(undefined, manuscript, theme)),
  );

  const [body, setBody] = useState(manuscript.body);
  const [format, setFormat] = useState<ManuscriptFormat>(
    manuscript.format ?? DEFAULT_MANUSCRIPT_FORMAT,
  );
  const [guideOpen, setGuideOpen] = useState(false);
  const [maxLines, setMaxLines] = useState(manuscript.maxLines || fittedLines);
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
    setMaxLines(clampLines(opened.maxLines || fittedLines, openedFormat));
  });

  const changeFormat = (next: ManuscriptFormat) => {
    setFormat(next);
    setMaxLines((lines) => clampLines(lines, next));
  };

  const regenerate = () => {
    onRegenerate(body, maxLines, format);
    onClose();
  };

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
        <div className="mb-4">
          <IconButton
            icon={Info}
            title="How the text is read"
            filled
            onClick={() => setGuideOpen(true)}
          />
        </div>
      </div>
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
              ? `Lines of text per slide, roughly (${maxLines})`
              : `Max lines per slide (${maxLines})`
          }
        >
          <RangeSlider
            value={maxLines}
            min={LINE_RANGE[format].min}
            max={LINE_RANGE[format].max}
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
    </Modal>
  );
};
