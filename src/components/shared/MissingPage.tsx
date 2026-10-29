import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";

interface MissingPageProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export const MissingPage = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: MissingPageProps) => (
  <div className="grid h-full place-items-center p-6">
    <EmptyState
      icon={icon}
      title={title}
      message={message}
      action={
        <Button onClick={onAction}>
          <ArrowLeft size={15} />
          {actionLabel}
        </Button>
      }
    />
  </div>
);
