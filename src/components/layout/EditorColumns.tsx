import type { ReactNode } from "react";

interface EditorColumnsProps {
  list: ReactNode;
  preview: ReactNode;
  inspector: ReactNode;
}

export const EditorColumns = ({
  list,
  preview,
  inspector,
}: EditorColumnsProps) => (
  <div className="grid min-h-0 flex-1 grid-cols-[292px_1fr_308px]">
    <div className="overflow-auto border-r border-border">{list}</div>
    <div className="overflow-auto">{preview}</div>
    <div className="overflow-auto border-l border-border">{inspector}</div>
  </div>
);

export const EditorStackedBody = ({ children }: { children: ReactNode }) => (
  <div className="min-h-0 flex-1 overflow-auto">{children}</div>
);

interface PanelHeaderProps {
  title: string;
  action?: ReactNode;
}

export const PanelHeader = ({ title, action }: PanelHeaderProps) => (
  <div className="sticky top-0 z-2 flex items-center justify-between border-b border-border bg-background px-3.5 pt-3.5 pb-2.5">
    <span className="section-label">{title}</span>
    {action}
  </div>
);

export const previewStageClassName =
  "flex flex-col bg-[radial-gradient(circle_at_50%_0%,rgb(255_255_255/0.02),transparent_60%)] p-6";

export const previewFrameClassName =
  "m-auto w-full max-w-205 rounded-[14px] shadow-[0_30px_70px_rgb(0_0_0/0.5)]";
