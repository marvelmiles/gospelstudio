import { useStore } from "../../store/useStore";
import { APP_NAME } from "../../lib/appInfo";
import { AppIconLoader } from "./AppIconLoader";

export const ResetOverlay = () => {
  const resetting = useStore((s) => s.resetting);
  if (!resetting) return null;

  return (
    <div className="fixed inset-0 z-500 grid place-items-center bg-scrim-strong p-6 backdrop-blur-sm">
      <div className="max-w-90 text-center">
        <AppIconLoader
          size={56}
          label={`Resetting ${APP_NAME}`}
          className="mx-auto mb-5"
        />
        <div className="text-[22px] font-semibold text-foreground">
          Resetting {APP_NAME}
        </div>
        <p className="mt-2.5 text-sm leading-[1.6] text-muted-foreground">
          Restoring defaults. Please don't reload or close this tab.
        </p>
      </div>
    </div>
  );
};
