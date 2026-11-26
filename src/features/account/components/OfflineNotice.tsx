import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";

interface OfflineNoticeProps {
  message: string;
}

export const OfflineNotice = ({ message }: OfflineNoticeProps) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <Alert variant="warning" className="mb-3.5">
      <WifiOff aria-hidden />
      <AlertDescription className="text-[13px]">{message}</AlertDescription>
    </Alert>
  );
};
