import { Link2 } from "lucide-react";
import { InfoTip } from "@/components/shared/InfoTip";

export const CloneNote = () => (
  <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-primary/30 bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-foreground">
    <Link2 size={14} className="shrink-0 text-primary-soft" />
    <span className="flex-1">Linked clone</span>
    <InfoTip title="Linked clone" align="end" size={13}>
      What it shows, how it looks, stepping through it in the PiP and deleting
      it all apply to its clones too. Its place, size, hiding and locking are
      its own. Choose Unlink clone in its menu to make it stand on its own.
    </InfoTip>
  </div>
);
