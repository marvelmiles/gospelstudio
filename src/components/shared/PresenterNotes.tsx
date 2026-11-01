import { StickyNote } from "lucide-react";

export const PresenterNotes = ({ notes }: { notes: string }) => (
  <div className="flex items-start gap-1.75 border-t border-border bg-primary/9 px-2.5 py-2">
    <StickyNote size={13} className="mt-px shrink-0 text-primary-soft" />
    <div className="max-h-16.5 min-w-0 flex-1 overflow-y-auto text-[11.5px] leading-[1.45] font-medium whitespace-pre-line text-foreground">
      {notes}
    </div>
  </div>
);
