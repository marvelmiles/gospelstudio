import { useState, type ReactNode } from "react";
import { PanelTabs, type PanelTab } from "@/components/shared/PanelTabs";
import { EditorStackedBody } from "./EditorColumns";

type SplitPane = "preview" | "sidebar";

export type StackedTabLabels = Record<SplitPane, string>;

interface EditorSplitLayoutProps {
  stacked: boolean;
  preview: ReactNode;
  sidebar: ReactNode;
  stackedTabs?: StackedTabLabels;
}

export const EditorSplitLayout = ({
  stacked,
  preview,
  sidebar,
  stackedTabs,
}: EditorSplitLayoutProps) => {
  if (!stacked)
    return (
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_340px]">
        <div className="overflow-hidden">{preview}</div>
        <div className="overflow-auto border-l border-border">{sidebar}</div>
      </div>
    );

  if (stackedTabs)
    return (
      <TabbedPanes labels={stackedTabs} preview={preview} sidebar={sidebar} />
    );

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      {preview}
      <div className="border-t border-border">{sidebar}</div>
    </div>
  );
};

interface TabbedPanesProps {
  labels: StackedTabLabels;
  preview: ReactNode;
  sidebar: ReactNode;
}

const TabbedPanes = ({ labels, preview, sidebar }: TabbedPanesProps) => {
  const [pane, setPane] = useState<SplitPane>("preview");
  const tabs: PanelTab<SplitPane>[] = [
    { id: "preview", label: labels.preview },
    { id: "sidebar", label: labels.sidebar },
  ];

  return (
    <>
      <PanelTabs
        tabs={tabs}
        value={pane}
        onChange={setPane}
        ariaLabel="Editor panels"
      />
      <EditorStackedBody>
        <div hidden={pane !== "preview"} className="h-full">
          {preview}
        </div>
        <div hidden={pane !== "sidebar"}>{sidebar}</div>
      </EditorStackedBody>
    </>
  );
};
