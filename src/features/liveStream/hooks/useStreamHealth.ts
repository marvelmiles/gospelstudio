import {
  LoaderCircle,
  Signal,
  SignalLow,
  SignalMedium,
  type LucideIcon,
} from "lucide-react";
import type { StreamHealth } from "../lib/adaptiveBitrate";
import { useLiveStreamStore } from "../lib/liveStreamStore";

export type HealthTone = "good" | "warning" | "bad" | "neutral";

export interface StreamHealthView {
  label: string;
  detail: string;
  tone: HealthTone;
  icon: LucideIcon;
  isReconnecting: boolean;
}

const RECONNECTING: StreamHealthView = {
  label: "Reconnecting",
  detail:
    "The internet connection dropped. Reconnecting now, viewers may see a short pause.",
  tone: "warning",
  icon: LoaderCircle,
  isReconnecting: true,
};

const CHECKING: StreamHealthView = {
  label: "Checking connection",
  detail: "Measuring the upload speed.",
  tone: "neutral",
  icon: Signal,
  isReconnecting: false,
};

const BY_HEALTH: Record<StreamHealth, StreamHealthView> = {
  good: {
    label: "Strong connection",
    detail: "Sending the full picture quality.",
    tone: "good",
    icon: Signal,
    isReconnecting: false,
  },
  weak: {
    label: "Weak connection",
    detail:
      "The picture quality is lowered a little to keep the stream smooth. Sound keeps its quality.",
    tone: "warning",
    icon: SignalMedium,
    isReconnecting: false,
  },
  poor: {
    label: "Very weak connection",
    detail:
      "The picture is lowered and some frames are skipped to keep the stream going. Sound keeps its quality.",
    tone: "bad",
    icon: SignalLow,
    isReconnecting: false,
  },
};

export const HEALTH_TONE_CLASS: Record<HealthTone, string> = {
  good: "text-success",
  warning: "text-warning",
  bad: "text-destructive",
  neutral: "text-muted-foreground",
};

export const useStreamHealth = (): StreamHealthView => {
  const connection = useLiveStreamStore((state) => state.connection);
  const health = useLiveStreamStore((state) => state.stats?.health ?? null);
  if (connection === "reconnecting") return RECONNECTING;
  if (connection === "connecting" || !health) return CHECKING;
  return BY_HEALTH[health];
};
