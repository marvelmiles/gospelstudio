import { Shield, ShieldCheck } from "lucide-react";
import { canKeep, type KeepableKind } from "../../lib/keepOnReset";
import { useKeepOnResetState, type KeepableItem } from "./useKeepOnReset";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "./IconButton";

export const KeepOnResetToggle = ({
  kind,
  item,
  variant = "icon",
}: {
  kind: KeepableKind;
  item: KeepableItem;
  variant?: "icon" | "button";
}) => {
  const state = useKeepOnResetState(kind, item);
  if (!state.available) return null;

  if (variant === "icon") {
    return (
      <IconButton
        icon={state.kept ? ShieldCheck : Shield}
        title={state.title}
        active={state.kept}
        disabled={state.full}
        onClick={state.toggle}
      />
    );
  }

  return (
    <Button
      size="sm"
      variant={state.kept ? "default" : "secondary"}
      title={state.title}
      disabled={state.full}
      onClick={state.toggle}
    >
      {state.kept ? <ShieldCheck size={13} /> : <Shield size={13} />}
      {state.kept ? "Kept on reset" : "Keep on reset"}
    </Button>
  );
};

export const KeepOnResetBadge = ({
  item,
}: {
  item: { keepOnReset?: boolean; builtIn?: boolean; deleted?: boolean };
}) => {
  if (!item.keepOnReset || !canKeep(item)) return null;
  return (
    <Badge
      variant="soft"
      title="Kept: this survives a reset"
      aria-label="Kept on reset"
      className="size-4.5 p-0 [&>svg]:size-2.5"
    >
      <ShieldCheck />
    </Badge>
  );
};
