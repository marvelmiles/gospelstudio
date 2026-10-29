import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { CardActions, CardTitle } from "./InteractiveCard";
import { cardOpenProps } from "./cardOpenProps";

interface LibraryListRowProps {
  cover: ReactNode;
  title: string;
  badges?: ReactNode;
  details: string[];
  actions: ReactNode;
  onOpen: () => void;
}

export const listClassName = "flex flex-col gap-2.5";

export const LibraryListRow = ({
  cover,
  title,
  badges,
  details,
  actions,
  onOpen,
}: LibraryListRowProps) => (
  <div
    className={cn(
      "flex cursor-pointer flex-wrap items-center gap-3 glass p-2.5 transition-colors duration-150 hover:border-input focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      "md:flex-nowrap md:py-2.5 md:pr-3.5 md:pl-2.5",
    )}
    {...cardOpenProps(title, onOpen)}
  >
    <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-[9px] bg-thumbnail md:w-33">
      {cover}
    </div>
    <div className="min-w-0 flex-1">
      <CardTitle title={title}>{badges}</CardTitle>
      <div className="mt-1.25 flex flex-wrap gap-x-3 gap-y-0.75 text-[12.5px] leading-normal text-muted-foreground">
        {details.map((detail) => (
          <span key={detail}>{detail}</span>
        ))}
      </div>
    </div>
    <CardActions className="mt-0 w-full shrink-0 md:w-auto md:justify-end">
      {actions}
    </CardActions>
  </div>
);
