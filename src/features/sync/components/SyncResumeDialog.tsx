import { useNavigate } from "react-router-dom";
import { CloudUpload, ListChecks } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import routes from "../../../routes";
import { keepSyncPaused, manageSyncFirst, turnOnSync } from "../syncControls";
import { syncResumeTextOf } from "../syncResumeText";
import { useSyncStore } from "../syncStore";

export const SyncResumeDialog = () => {
  const navigate = useNavigate();
  const consent = useSyncStore((state) => state.consent);
  if (!consent) return null;

  const { title, message } = syncResumeTextOf(
    consent.reason,
    consent.pendingCount,
  );
  const notNow = () => void keepSyncPaused(consent.accountId);
  const manage = () => {
    void manageSyncFirst(consent.accountId);
    navigate(routes.syncActivity());
  };

  return (
    <AlertDialog open onOpenChange={(isOpen) => !isOpen && notNow()}>
      <AlertDialogContent className="sm:max-w-120">
        <AlertDialogHeader>
          <AlertDialogMedia className="size-11 bg-primary/14 text-primary-soft *:[svg:not([class*='size-'])]:size-5">
            <CloudUpload />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[13.5px] leading-[1.6]">
            {message} Choose Manage syncs to see each item first and pick what
            to send.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={notNow}>
            Not now
          </Button>
          <Button variant="secondary" onClick={manage}>
            <ListChecks />
            Manage syncs
          </Button>
          <Button onClick={() => turnOnSync(consent.accountId)}>
            Continue sync
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
