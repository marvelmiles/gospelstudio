import { Monitor, MonitorPlay, MonitorX } from "lucide-react";
import { SectionTitle } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { useScreenAccess, type DisplayInfo } from "../../hooks/useScreenAccess";
import { cn } from "../../lib/cn";

const NOTE_BY_ACCESS = {
  unsupported:
    "This browser cannot put the live window on another display by itself. Go Live still opens a window you can drag onto the projector, then press F to fill it. Chrome or Edge can do it for you.",
  prompt:
    "Allow this once and Go Live opens straight onto the projector, in fullscreen, every time.",
  denied:
    "Display access is blocked for this site. Open the padlock in the address bar, turn Window management back on, then reload.",
  granted: "",
} as const;

export const ProjectorSection = () => {
  const { access, isExtended, displays, isAsking, allowDisplays } =
    useScreenAccess();

  const note = NOTE_BY_ACCESS[access];

  return (
    <>
      <SectionTitle>Projector</SectionTitle>
      <div className="mb-4.5">
        {note && (
          <p className="mt-0 mb-3 text-[12.5px] leading-[1.65] text-sub">
            {note}
          </p>
        )}

        {access === "prompt" && (
          <Button variant="primary" onClick={allowDisplays} busy={isAsking}>
            <MonitorPlay size={15} />
            Allow display access
          </Button>
        )}

        {access === "granted" && displays.length > 0 && (
          <div className="grid gap-2">
            {displays.map((display) => (
              <DisplayRow key={display.id} display={display} />
            ))}
          </div>
        )}

        {access === "granted" && !isExtended && (
          <p className="mt-2.5 mb-0 text-[12.5px] leading-[1.65] text-sub">
            Only this display is connected. Plug the projector in and set
            Windows to Extend, rather than Duplicate, to keep the running order
            on the laptop while the audience sees the slides.
          </p>
        )}

        {access === "denied" && (
          <span className="inline-flex items-center gap-1.75 text-[12.5px] font-semibold text-danger">
            <MonitorX size={15} />
            Blocked by this browser
          </span>
        )}
      </div>
    </>
  );
};

const DisplayRow = ({ display }: { display: DisplayInfo }) => {
  const Icon = display.isProjector ? MonitorPlay : Monitor;
  const badge = display.isProjector
    ? "Live output"
    : display.isCurrent
      ? "This screen"
      : "";

  return (
    <div
      className={cn(
        "flex items-center gap-2.75 rounded-[11px] border bg-raise px-3 py-2.5",
        display.isProjector ? "border-accent/40" : "border-line",
      )}
    >
      <Icon
        size={17}
        className={cn(
          "shrink-0",
          display.isProjector ? "text-accent-soft" : "text-sub",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-fg">
          {display.label}
        </span>
        <span className="text-[11.5px] text-sub">{display.size}</span>
      </span>
      {badge && (
        <span
          className={cn(
            "rounded-full px-2.25 py-1 text-[11px] font-bold tracking-[0.3px] whitespace-nowrap",
            display.isProjector
              ? "bg-accent/16 text-accent-soft"
              : "bg-fg/7 text-sub",
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
};
