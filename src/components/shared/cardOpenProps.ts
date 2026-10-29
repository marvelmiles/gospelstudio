import type { KeyboardEvent } from "react";

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
