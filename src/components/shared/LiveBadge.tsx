export const LiveBadge = ({ title }: { title: string }) => (
  <span
    title={title}
    className="inline-flex items-center gap-1 rounded-full bg-destructive px-1.75 py-0.5 text-[9.5px] font-extrabold tracking-[0.5px] text-primary-foreground"
  >
    <span className="size-1.25 rounded-full bg-primary-foreground" />
    LIVE
  </span>
);
