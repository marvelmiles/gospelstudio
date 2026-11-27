import { useRef, useState, type ChangeEvent } from "react";
import { Image as ImageIcon, ImageUp, Trash2 } from "lucide-react";
import type { Account } from "@/contracts/accountContract";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { useSubmission } from "../../../hooks/useSubmission";
import { cn } from "../../../lib/utils";
import { UserFacingError } from "../../../lib/userProblem";
import { useStore } from "../../../store/useStore";
import { removeChurchLogo, uploadChurchLogo } from "../api/churchLogoApi";
import { useChurchLogo } from "../hooks/useChurchLogo";
import {
  CHURCH_LOGO_ACCEPT,
  CHURCH_LOGO_RULES,
  logoFileProblem,
} from "../lib/churchLogo";
import {
  replaceChurchLogo,
  type ChurchLogoView,
} from "../session/churchLogoStore";
import { FormProblem } from "./FormProblem";

type LogoAction = "upload" | "remove";

interface LogoPreviewProps {
  logo: ChurchLogoView;
  churchName: string;
}

const LogoPreview = ({ logo, churchName }: LogoPreviewProps) => (
  <div
    className={cn(
      "grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-background",
      logo.status === "loading" && "animate-pulse",
    )}
  >
    {logo.status === "ready" ? (
      <img
        src={logo.url}
        alt={`${churchName} logo`}
        draggable={false}
        className="size-full object-cover"
      />
    ) : (
      <ImageIcon size={26} aria-hidden className="text-subtle-foreground" />
    )}
  </div>
);

interface ChurchLogoSectionProps {
  account: Account;
}

export const ChurchLogoSection = ({ account }: ChurchLogoSectionProps) => {
  const isOnline = useOnlineStatus();
  const pushToast = useStore((state) => state.pushToast);
  const { problem, submit } = useSubmission();
  const logo = useChurchLogo(account.id);
  const fileInput = useRef<HTMLInputElement>(null);
  const [runningAction, setRunningAction] = useState<LogoAction | null>(null);
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);

  const hasLogo = logo.status === "ready";
  const isBusy = runningAction !== null;

  const run = async (
    action: LogoAction,
    work: () => Promise<void>,
    doneMessage: string,
  ) => {
    setRunningAction(action);
    const done = await submit(work);
    setRunningAction(null);
    if (done) pushToast(doneMessage);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void run(
      "upload",
      async () => {
        const fileProblem = logoFileProblem(file);
        if (fileProblem) throw new UserFacingError(fileProblem);
        await uploadChurchLogo(file);
        replaceChurchLogo(account.id, file);
      },
      "Logo saved.",
    );
  };

  const confirmRemoval = () => {
    setIsConfirmingRemoval(false);
    void run(
      "remove",
      async () => {
        await removeChurchLogo();
        replaceChurchLogo(account.id, null);
      },
      "Logo removed.",
    );
  };

  return (
    <Panel>
      <PanelTitle title="Church logo" icon={ImageIcon} />
      <FormProblem problem={problem} />
      <div className="flex items-center gap-4">
        <LogoPreview logo={logo} churchName={account.churchName} />
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              busy={runningAction === "upload"}
              disabled={!isOnline || isBusy}
              onClick={() => fileInput.current?.click()}
            >
              <ImageUp size={15} />
              {hasLogo ? "Replace logo" : "Upload logo"}
            </Button>
            {hasLogo && (
              <Button
                variant="ghost"
                busy={runningAction === "remove"}
                disabled={!isOnline || isBusy}
                onClick={() => setIsConfirmingRemoval(true)}
              >
                <Trash2 size={15} />
                Remove
              </Button>
            )}
          </div>
          <p className="mt-2 mb-0 text-xs text-muted-foreground">
            {CHURCH_LOGO_RULES}
          </p>
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={CHURCH_LOGO_ACCEPT}
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={handleFileChange}
      />
      <ConfirmDialog
        open={isConfirmingRemoval}
        icon={Trash2}
        title="Remove the church logo?"
        message="Your church's initials will show in its place. You can upload a logo again at any time."
        confirmLabel="Remove logo"
        onConfirm={confirmRemoval}
        onCancel={() => setIsConfirmingRemoval(false)}
      />
    </Panel>
  );
};
