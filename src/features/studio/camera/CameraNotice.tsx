import type { LucideIcon } from "lucide-react";

interface CameraNoticeProps {
  icon: LucideIcon;
  title: string;
  message: string;
}

export const CameraNotice = ({
  icon: Icon,
  title,
  message,
}: CameraNoticeProps) => (
  <div className="mx-auto max-w-110 text-center">
    <span className="mx-auto mb-2.5 grid size-12 place-items-center rounded-2xl bg-primary/14 text-primary-soft">
      <Icon size={22} />
    </span>
    <div className="mb-1 text-base font-semibold text-foreground">{title}</div>
    <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
      {message}
    </p>
  </div>
);
