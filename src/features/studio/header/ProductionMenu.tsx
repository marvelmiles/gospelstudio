import { useState } from "react";
import { ChevronDown, Clapperboard, Plus } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { ProductionSummary } from "../types/production";
import { useProductionStore } from "../store/productionStore";
import {
  deleteProduction,
  duplicateProduction,
  openProduction,
  renameProduction,
  startNewProduction,
} from "../store/productionActions";
import { NameDialog } from "../scenes/NameDialog";
import { ProductionListItem } from "./ProductionListItem";

type MenuDialog =
  | { kind: "create" }
  | { kind: "rename"; production: ProductionSummary }
  | { kind: "delete"; production: ProductionSummary };

export const ProductionMenu = () => {
  const production = useProductionStore((state) => state.production);
  const productions = useProductionStore((state) => state.productions);
  const pushToast = useStore((state) => state.pushToast);
  const [isListOpen, setIsListOpen] = useState(false);
  const [dialog, setDialog] = useState<MenuDialog | null>(null);
  if (!production) return null;

  const closeListThen = (action: () => void) => () => {
    setIsListOpen(false);
    action();
  };

  return (
    <>
      <Popover open={isListOpen} onOpenChange={setIsListOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="max-w-64 min-w-0 gap-2 px-2.5"
            title="Switch, rename or create a production"
          >
            <Clapperboard className="text-primary-soft" />
            <span className="min-w-0 truncate text-[14.5px] text-foreground">
              {production.name}
            </span>
            <ChevronDown className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-72 flex-col p-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={closeListThen(() => setDialog({ kind: "create" }))}
          >
            <Plus />
            New production
          </Button>
          <Separator className="my-1" />
          <ul
            aria-label="Productions"
            className="m-0 flex max-h-80 list-none flex-col gap-0.5 overflow-y-auto p-0"
          >
            {productions.map((entry) => (
              <ProductionListItem
                key={entry.id}
                production={entry}
                isOpen={entry.id === production.id}
                onOpen={closeListThen(() => void openProduction(entry.id))}
                onRename={closeListThen(() =>
                  setDialog({ kind: "rename", production: entry }),
                )}
                onDuplicate={closeListThen(
                  () => void duplicateProduction(entry.id),
                )}
                onDelete={closeListThen(() =>
                  setDialog({ kind: "delete", production: entry }),
                )}
              />
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      {dialog?.kind === "rename" && (
        <NameDialog
          title="Rename production"
          label="Production name"
          initialName={dialog.production.name}
          onSave={(name) =>
            void renameProduction(dialog.production.id, name).catch(() =>
              pushToast("The production could not be renamed.", "error"),
            )
          }
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "create" && (
        <NameDialog
          title="New production"
          label="Production name"
          initialName="Evening service"
          confirmLabel="Create"
          onSave={(name) => void startNewProduction(name)}
          onClose={() => setDialog(null)}
        />
      )}
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title={`Delete ${dialog?.kind === "delete" ? dialog.production.name : "this production"}?`}
        message="All of its scenes are removed from this device. This cannot be undone."
        onConfirm={() => {
          if (dialog?.kind === "delete")
            void deleteProduction(dialog.production.id);
          setDialog(null);
        }}
        onCancel={() => setDialog(null)}
      />
    </>
  );
};
