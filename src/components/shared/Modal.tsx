import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconButton } from "./IconButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
  info?: ReactNode;
  headerActions?: ReactNode;
  dismissible?: boolean;
}

const preventDismiss = (event: Event) => event.preventDefault();

export const Modal = ({
  open,
  onClose,
  title,
  children,
  width = 520,
  footer,
  info,
  headerActions,
  dismissible = true,
}: ModalProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent
      showCloseButton={false}
      aria-describedby={undefined}
      onInteractOutside={dismissible ? undefined : preventDismiss}
      onEscapeKeyDown={dismissible ? undefined : preventDismiss}
      style={{ maxWidth: `min(${width}px, calc(100% - 2rem))` }}
      className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
    >
      <DialogHeader className="shrink-0 flex-row items-center gap-2 border-b px-5.5 py-4.5 text-left">
        <DialogTitle className="text-[19px] leading-tight">{title}</DialogTitle>
        {info && <div className="ml-1.5">{info}</div>}
        {(headerActions || dismissible) && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {headerActions}
            {dismissible && (
              <DialogClose asChild>
                <IconButton icon={X} title="Close" />
              </DialogClose>
            )}
          </div>
        )}
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5.5">
        {children}
      </div>
      {footer && (
        <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-end gap-2.5 border-t px-5.5 py-4">
          {footer}
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);
