import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import type { Toast } from "../../types";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/cn";

export const Toaster = () => {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-400 flex w-[min(420px,calc(100vw-32px))] -translate-x-1/2 flex-col gap-2.5">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
};

const ToastItem = ({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) => {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3400);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  const success = toast.kind === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "pointer-events-auto flex animate-toast-in items-center gap-3 rounded-[13px] border border-l-3 border-line bg-panel px-3.5 py-3.25 shadow-overlay backdrop-blur-sm",
        success ? "border-l-success" : "border-l-danger",
      )}
    >
      <Icon size={19} className={success ? "text-success" : "text-danger"} />
      <span className="flex-1 text-[13.5px] text-fg">{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid place-items-center border-none bg-transparent text-dim"
      >
        <X size={15} />
      </button>
    </div>
  );
};
