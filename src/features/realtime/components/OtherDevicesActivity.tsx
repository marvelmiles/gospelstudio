import { MonitorSmartphone } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { otherDevicesOf, useRealtimeStore } from "../realtimeStore";
import { DeviceActivityLine } from "./DeviceActivityLine";

export const OtherDevicesActivity = () => {
  const others = useRealtimeStore(useShallow(otherDevicesOf));
  if (others.length === 0) return null;

  return (
    <section aria-label="Your other devices" className="px-2.5 py-2">
      <div className="mb-1.5 text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
        Your other devices
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {others.map((device) => (
          <li key={device.sessionId} className="flex items-start gap-2.5">
            <MonitorSmartphone
              size={15}
              aria-hidden
              className="mt-0.5 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-foreground">
                {device.deviceName}
              </div>
              <DeviceActivityLine activity={device.activity} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
