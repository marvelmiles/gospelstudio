import type { MouseEvent, ReactNode } from "react";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmTone = "danger" | "default";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: LucideIcon;
  onConfirm: () => void;
  onCancel: () => void;
}

const TONE_STYLES: Record<ConfirmTone, string> = {
  danger: "bg-destructive/14 text-destructive",
  default: "bg-primary/14 text-primary-soft",
};

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const confirm = (event: MouseEvent) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-110">
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn(
              "size-11 *:[svg:not([class*='size-'])]:size-5",
              TONE_STYLES[tone],
            )}
          >
            <Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[13.5px] leading-[1.6]">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={tone === "danger" ? "destructive" : "default"}
            onClick={confirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
