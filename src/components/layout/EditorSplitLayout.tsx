import type { ReactNode } from "react";

interface EditorSplitLayoutProps {
  stacked: boolean;
  preview: ReactNode;
  sidebar: ReactNode;
}

export const EditorSplitLayout = ({
  stacked,
  preview,
  sidebar,
}: EditorSplitLayoutProps) =>
  stacked ? (
    <div className="min-h-0 flex-1 overflow-auto">
      {preview}
      <div className="border-t border-line">{sidebar}</div>
    </div>
  ) : (
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_340px]">
      <div className="overflow-hidden">{preview}</div>
      <div className="overflow-auto border-l border-line">{sidebar}</div>
    </div>
  );
