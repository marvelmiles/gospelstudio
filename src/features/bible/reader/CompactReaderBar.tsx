import type { ReactNode } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/shared/IconButton";
import { MoreMenu } from "@/components/shared/MoreMenu";
import type { MenuItem } from "@/components/shared/menuItem";

interface CompactReaderBarProps {
  chapterLabel: string;
  onBack?: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  versionPicker?: ReactNode;
  menuItems: MenuItem[];
  children?: ReactNode;
}

export const CompactReaderBar = ({
  chapterLabel,
  onBack,
  onPreviousChapter,
  onNextChapter,
  versionPicker,
  menuItems,
  children,
}: CompactReaderBarProps) => (
  <div className="sticky top-0 z-20 -mx-[clamp(14px,4vw,36px)] mb-2 border-b border-border bg-background/95 px-[clamp(14px,4vw,36px)] py-2 backdrop-blur-sm">
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
      <div className="flex min-w-0 flex-[1_1_auto] items-center">
        {onBack && (
          <IconButton
            icon={ArrowLeft}
            title="Back"
            size="sm"
            onClick={onBack}
          />
        )}
        <IconButton
          icon={ChevronLeft}
          title="Previous chapter"
          size="sm"
          onClick={onPreviousChapter}
        />
        <h2 className="m-0 min-w-0 flex-1 truncate px-1 text-center text-base font-semibold text-foreground">
          {chapterLabel}
        </h2>
        <IconButton
          icon={ChevronRight}
          title="Next chapter"
          size="sm"
          onClick={onNextChapter}
        />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {versionPicker}
        <MoreMenu items={menuItems} title="Reading options" size="sm" />
      </div>
    </div>
    {children}
  </div>
);
