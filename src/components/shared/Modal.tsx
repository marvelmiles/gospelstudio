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
  title: React.ReactNode;
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
      style={{ maxWidth: `min(${width}px, calc(100% - 1rem))` }}
      className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[90dvh] sm:max-w-none sm:rounded-[20px]"
    >
      <DialogHeader className="shrink-0 flex-row items-center gap-2 border-b px-3.5 py-3 text-left sm:px-5.5 sm:py-4.5">
        <DialogTitle className="min-w-0 text-[17px] leading-tight sm:text-[19px]">
          {title}
        </DialogTitle>
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5.5">
        {children}
      </div>
      {footer && (
        <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-end gap-2.5 border-t px-3.5 py-3 sm:px-5.5 sm:py-4">
          {footer}
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);
