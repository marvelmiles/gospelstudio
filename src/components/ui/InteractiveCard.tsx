import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CardOpenProps {
  role?: "button";
  tabIndex?: number;
  "aria-label"?: string;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export const cardOpenProps = (
  label: string,
  onOpen?: () => void,
): CardOpenProps => {
  if (!onOpen) return {};
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": `Open ${label}`,
    onClick: onOpen,
    onKeyDown: (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onOpen();
    },
  };
};

export const cardClassName =
  "glass flex flex-col overflow-hidden transition-colors duration-150 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&[role=button]]:cursor-pointer";

export const cardGridClassName =
  "grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4";

export const cardThumbClassName =
  "relative aspect-video overflow-hidden bg-thumbnail";

export const cardThumbBadgeClassName =
  "absolute top-2.25 right-2.25 rounded-lg bg-black/55 px-2.25 py-0.75 text-[11.5px] font-semibold text-white";

export const cardBodyClassName = "flex flex-1 flex-col px-3.75 py-3.25";

export const cardSubClassName = "mt-0.75 mb-3 text-[12.5px] text-sub";

export const CardTitle = ({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) => (
  <div className="flex min-w-0 items-center gap-1.75 text-[17px] leading-[1.2] font-semibold text-fg">
    <span className="min-w-0 flex-[0_1_auto] truncate">{title}</span>
    {children}
  </div>
);

export const CardActions = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn("mt-auto flex flex-wrap items-center gap-1.5", className)}
    onClick={(event) => event.stopPropagation()}
    onKeyDown={(event) => event.stopPropagation()}
  >
    {children}
  </div>
);
