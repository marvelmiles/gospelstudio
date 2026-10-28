import { useMemo } from "react";
import type { PointerEvent, ReactNode } from "react";
import type { Align, ResolvedStyle, VerticalAlign } from "../types";
import { cn } from "../lib/cn";
import { lineContentOffsets } from "../lib/inlineDocument";
import { analyzeLines, listMarkerLabel } from "../lib/lists";
import type { ListKind, ListLine } from "../lib/lists";
import type { SlideTextEditing } from "../hooks/useSlideTextEditor";
import { FormattedText } from "./FormattedText";

const INDENT_STEP_CQW = 3.2;

const FLEX_VERTICAL: Record<VerticalAlign, string> = {
  top: "items-start",
  middle: "items-center",
  bottom: "items-end",
};

interface ListItemLineProps {
  item: ListLine & { kind: ListKind };
  align: Align;
  painted: ReactNode;
  editable: boolean;
}

const ListItemLine = ({
  item,
  align,
  painted,
  editable,
}: ListItemLineProps) => {
  const label = listMarkerLabel(item.kind, item.index, item.level);
  const marker = cn("tabular-nums", editable && "select-none");

  if (align !== "left")
    return (
      <>
        <span
          aria-hidden
          contentEditable={false}
          className={cn(marker, "me-[0.9cqw]")}
        >
          {label}
        </span>
        {painted}
      </>
    );

  return (
    <span className="flex items-baseline gap-[0.9cqw]">
      <span
        aria-hidden
        contentEditable={false}
        className={cn(marker, "min-w-[2.6cqw] flex-none text-end")}
      >
        {label}
      </span>
      <span className="flex-1 text-start">{painted}</span>
    </span>
  );
};

interface SlideTextBlockProps {
  lines: string[];
  style: ResolvedStyle;
  lineStyles?: ResolvedStyle[];
  selectedLine?: number | null;
  editing?: SlideTextEditing;
  marked?: boolean;
  verticalAlign?: VerticalAlign;
  padding?: string;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
}

export const SlideTextBlock = ({
  lines,
  style,
  lineStyles,
  selectedLine,
  editing,
  marked,
  verticalAlign = "middle",
  padding,
  onPointerDown,
}: SlideTextBlockProps) => {
  const editable = Boolean(editing);
  const content = useMemo(() => (lines.length ? lines : [""]), [lines]);
  const items = useMemo(() => analyzeLines(content), [content]);
  const sourceOffsets = useMemo(
    () => (editable ? lineContentOffsets(content) : null),
    [editable, content],
  );
  const outlined = Boolean(marked) || selectedLine != null;

  return (
    <div
      ref={editing?.ref}
      contentEditable={editable || undefined}
      suppressContentEditableWarning={editable}
      spellCheck={editable ? false : undefined}
      role={editable ? "textbox" : undefined}
      aria-multiline={editable || undefined}
      aria-label={editable ? "Slide text" : undefined}
      onKeyDown={editing?.onKeyDown}
      onPointerDown={onPointerDown}
      style={{ padding }}
      className={cn(
        "absolute inset-0 flex outline-none",
        FLEX_VERTICAL[verticalAlign],
        editable && "cursor-text",
      )}
    >
      <div className="w-full">
        {items.map((item, index) => {
          const lineStyle = lineStyles?.[index] ?? style;
          const selected = selectedLine === index;
          const align = lineStyle.align || "center";
          const painted =
            sourceOffsets || item.content ? (
              <FormattedText
                text={item.content}
                baseWeight={lineStyle.fontWeight}
                sourceBase={sourceOffsets?.[index]}
              />
            ) : (
              " "
            );
          return (
            <div
              key={index}
              style={{
                textAlign: align,
                color: lineStyle.color,
                fontFamily: `'${lineStyle.fontFamily}', serif`,
                fontWeight: lineStyle.fontWeight,
                fontSize: `${lineStyle.fontSize}cqw`,
                lineHeight: lineStyle.lineHeight,
                letterSpacing: `${lineStyle.letterSpacing || 0}cqw`,
                textShadow: lineStyle.textShadow,
                paddingInlineStart: item.level
                  ? `${item.level * INDENT_STEP_CQW + (outlined ? 0.6 : 0)}cqw`
                  : undefined,
              }}
              className={cn(
                "rounded-md outline-offset-2",
                lineStyle.uppercase && "uppercase",
                editable && "whitespace-pre-wrap",
                outlined &&
                  "mx-[-0.6cqw] my-[-0.3cqw] px-[0.6cqw] py-[0.3cqw] outline-[0.25cqw] transition-[outline-color,background-color] duration-150",
                selected
                  ? "bg-accent/14 outline-accent"
                  : outlined && "outline-transparent outline-dashed",
              )}
            >
              {item.kind ? (
                <ListItemLine
                  item={{ ...item, kind: item.kind }}
                  align={align}
                  painted={painted}
                  editable={editable}
                />
              ) : (
                painted
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
