import { useEffect, useState } from "react";
import { LogOut, MonitorSmartphone } from "lucide-react";
import type { AccountSession } from "@/contracts/accountContract";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { problemMessageOf } from "../../../hooks/useSubmission";
import { formatDate, timeAgo } from "../../../lib/id";
import {
  listDevices,
  signOutDevice,
  signOutOtherDevices,
} from "../api/accountApi";
import { FormProblem } from "./FormProblem";

const ALL_OTHERS = "others";

interface DeviceRowProps {
  device: AccountSession;
  busy: boolean;
  onSignOut: () => void;
}

const DeviceRow = ({ device, busy, onSignOut }: DeviceRowProps) => (
  <li className="flex flex-wrap items-center gap-3 rounded-xl border bg-background/40 px-3 py-2.5">
    <MonitorSmartphone
      size={17}
      className="shrink-0 text-muted-foreground"
      aria-hidden
    />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-foreground">
        <span className="truncate">{device.deviceName}</span>
        {device.current && <Badge variant="secondary">This device</Badge>}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        Active {timeAgo(device.lastActiveAt)}. Signed in{" "}
        {formatDate(device.createdAt)}.
      </div>
    </div>
    {!device.current && (
      <Button size="sm" variant="ghost" busy={busy} onClick={onSignOut}>
        Sign out
      </Button>
    )}
  </li>
);

export const DevicesSection = () => {
  const [devices, setDevices] = useState<AccountSession[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busyWith, setBusyWith] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    listDevices().then(
      (found) => {
        if (!isCurrent) return;
        setDevices(found);
        setProblem(null);
      },
      (error: unknown) => {
        if (isCurrent) setProblem(problemMessageOf(error));
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [listVersion]);

  const run = async (key: string, action: () => Promise<void>) => {
    setBusyWith(key);
    try {
      await action();
      setListVersion((version) => version + 1);
    } catch (error) {
      setProblem(problemMessageOf(error));
    } finally {
      setBusyWith(null);
    }
  };

  const otherCount = devices?.filter((device) => !device.current).length ?? 0;

  return (
    <Panel>
      <PanelTitle
        title="Signed-in devices"
        icon={MonitorSmartphone}
        info="Signing a device out stops it syncing. Its library stays on that device."
      />
      <FormProblem problem={problem} />
      {devices === null ? (
        !problem && <Spinner className="mx-auto my-3 block" />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {devices.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              busy={busyWith === device.id}
              onSignOut={() =>
                void run(device.id, () => signOutDevice(device.id))
              }
            />
          ))}
        </ul>
      )}
      {otherCount > 1 && (
        <Button
          variant="secondary"
          className="mt-3"
          busy={busyWith === ALL_OTHERS}
          onClick={() => void run(ALL_OTHERS, signOutOtherDevices)}
        >
          <LogOut size={15} />
          Sign out all other devices
        </Button>
      )}
    </Panel>
  );
};
