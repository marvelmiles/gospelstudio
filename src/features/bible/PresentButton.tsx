import { Play } from "lucide-react";
import type { ScriptureSelection } from "../../store/useStore";
import { Button } from "@/components/ui/button";
import { PresentMenu } from "@/components/shared/PresentMenu";
import { usePresentScripture } from "./usePresentScripture";

export const PresentButton = ({
  selection,
  label = "Present",
  title,
  disabled,
}: {
  selection: ScriptureSelection | null | (() => ScriptureSelection | null);
  label?: string;
  title?: string;
  disabled?: boolean;
}) => {
  const { present } = usePresentScripture();

  return (
    <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
      <PresentMenu
        disabled={disabled}
        title={title}
        onPresent={({ live }) => {
          if (disabled) return;
          present(
            typeof selection === "function" ? selection() : selection,
            live,
          );
        }}
      >
        <Button size="sm" title={title} disabled={disabled}>
          <Play />
          {label}
        </Button>
      </PresentMenu>
    </span>
  );
};
