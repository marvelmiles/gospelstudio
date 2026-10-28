import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./Button";

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
}: ModalProps) => {
  if (!open) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismissible ? onClose : undefined}
      className="fixed inset-0 z-200 flex animate-fade-in items-center justify-center bg-scrim p-5 backdrop-blur-[10px]"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: width }}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden glass rounded-[20px] bg-panel shadow-[0_16px_32px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.06)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-5.5 py-4.5">
          <h3 className="m-0 text-[19px] font-semibold text-fg">{title}</h3>
          {info && <div className="mr-auto ml-1.5">{info}</div>}
          {(headerActions || dismissible) && (
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {headerActions}
              {dismissible && (
                <IconButton icon={X} onClick={onClose} title="Close" />
              )}
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5.5">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-line px-5.5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
