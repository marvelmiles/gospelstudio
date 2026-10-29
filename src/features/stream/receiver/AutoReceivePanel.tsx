import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useValueChange } from "@/hooks/useValueChange";
import { KeyRound, MonitorSmartphone, RotateCcw } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LobbyActions } from "../components/LobbyActions";
import { QuickConnectNote } from "../components/QuickConnectNote";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { deriveNetworkRoom } from "../../../lib/networkRoom";
import { watchBroadcasters, type DeviceEntry } from "../lib/signaling";
import {
  canJoinCamera,
  connectStreamCamera,
  disconnectStreamCamera,
  findCamera,
  MAX_STREAM_CAMERAS,
  useStreamSession,
} from "../lib/streamSession";
import { DeviceRow } from "./DeviceRow";

interface AutoReceivePanelProps {
  onBack: () => void;
  onUseCode: () => void;
}

export const AutoReceivePanel = ({
  onBack,
  onUseCode,
}: AutoReceivePanelProps) => {
  const pushToast = useStore((s) => s.pushToast);
  const session = useStreamSession();
  const [isSearching, setIsSearching] = useState(true);
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const roomRef = useRef<string | null>(null);
  const [viewerId] = useState(() => crypto.randomUUID());

  useValueChange(session.active, (active) => {
    if (!active) setSearchCount((count) => count + 1);
  });

  useValueChange(searchCount, () => {
    setIsSearching(true);
    setDevices([]);
  });

  const leaveForCode = useEffectEvent(() => {
    pushToast("Couldn't detect your network. Use a code instead.", "error");
    onUseCode();
  });

  useEffect(() => {
    let isCancelled = false;
    let stopWatching = () => {};

    void deriveNetworkRoom().then((room) => {
      if (isCancelled) return;
      if (!room) {
        leaveForCode();
        return;
      }
      roomRef.current = room;
      setIsSearching(false);
      stopWatching = watchBroadcasters(room, (nextDevices) => {
        if (!isCancelled) setDevices(nextDevices);
      });
    });

    return () => {
      isCancelled = true;
      stopWatching();
    };
  }, [searchCount]);

  const isFull = session.active && !canJoinCamera(session);

  const connect = (device: DeviceEntry) => {
    const room = roomRef.current;
    if (!room || isFull) return;
    void connectStreamCamera({ room, device, viewerId });
  };

  return (
    <div className="mx-auto max-w-140">
      <Panel className="p-5">
        <PanelTitle
          icon={MonitorSmartphone}
          title="Devices on your WiFi"
          info={`On the other device, open Stream and choose Share this camera. Pick it here, up to ${MAX_STREAM_CAMERAS} in all.`}
        />
        {isSearching ? (
          <WaitingState>Searching for devices</WaitingState>
        ) : devices.length === 0 ? (
          <WaitingState>Waiting for a device to start sharing</WaitingState>
        ) : (
          <div className="flex flex-col gap-2.5">
            {devices.map((device) => (
              <DeviceRow
                key={device.id}
                device={device}
                camera={findCamera(session, device.id)}
                session={session}
                isFull={isFull}
                onConnect={() => connect(device)}
                onDisconnect={() => disconnectStreamCamera(device.id)}
              />
            ))}
          </div>
        )}
      </Panel>

      <QuickConnectNote />

      <LobbyActions>
        <Button variant="secondary" size="sm" onClick={onUseCode}>
          <KeyRound size={14} />
          Pair with a code instead
        </Button>
        <Button variant="secondary" size="sm" onClick={onBack}>
          <RotateCcw size={14} />
          Back
        </Button>
      </LobbyActions>
    </div>
  );
};

const WaitingState = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center gap-3 py-7">
      <Spinner size={20} />
      <span className="text-[13px] text-muted-foreground">{children}</span>
    </div>
  );
};
