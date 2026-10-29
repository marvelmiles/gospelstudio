import { useState } from "react";
import {
  ArrowRight,
  MonitorSmartphone,
  Radio,
  ShieldAlert,
  Video,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { ReceiverLobby } from "./receiver/ReceiverLobby";
import { SenderLobby } from "./sender/SenderLobby";
import { CameraPanel } from "./CameraPanel";
import { useStreamSession } from "./lib/streamSession";
import { InfoTip } from "@/components/shared/InfoTip";

type Role = "choose" | "receive" | "send";

const STREAM_SUBTITLE = "Share and project cameras over WiFi.";

export const StreamPage = () => {
  useDocumentTitle("Stream");
  const [role, setRole] = useState<Role>("choose");

  if (!window.isSecureContext) {
    return (
      <div className={pageClassName}>
        <PageHeader title="Stream" subtitle={STREAM_SUBTITLE} />
        <div className="mx-auto mt-10 max-w-140 rounded-2xl border border-border bg-secondary p-6 text-center">
          <ShieldAlert size={30} className="mx-auto mb-3 text-destructive" />
          <div className="mb-2 text-lg font-semibold text-foreground">
            Streaming needs a secure connection
          </div>
          <p className="m-0 text-[13.5px] leading-[1.6] text-muted-foreground">
            Cameras only open on an <strong>https://</strong> address (or
            localhost). Open this app over https on both devices and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      <PageHeader title="Stream" subtitle={STREAM_SUBTITLE} />

      <div className="min-h-0 flex-1 overflow-y-auto pb-5">
        {role === "choose" && (
          <div className="mx-auto mt-2.5 grid max-w-180 grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            <RoleCard
              icon={MonitorSmartphone}
              title="Show a camera here"
              body="Receive and project a camera"
              cta="Receive a camera"
              onClick={() => setRole("receive")}
            />
            <RoleCard
              icon={Radio}
              title="Share this camera"
              body="Send this camera to another device"
              cta="Share this camera"
              onClick={() => setRole("send")}
            />
          </div>
        )}

        {role === "receive" && (
          <ReceiverLobby onBack={() => setRole("choose")} />
        )}
        {role === "send" && <SenderLobby onBack={() => setRole("choose")} />}

        <BroadcastCamerasSection />
      </div>
    </div>
  );
};

const BroadcastCamerasSection = () => {
  const session = useStreamSession();

  if (!session.active || session.mode !== "pip") return null;

  return (
    <section className="mx-auto mt-5.5 max-w-140 rounded-2xl border border-border bg-secondary p-5">
      <div className="mb-1.5 flex items-center gap-2.25">
        <Video size={18} className="text-primary-soft" />
        <span className="text-[17px] font-semibold text-foreground">
          Live cameras
        </span>
        <InfoTip title="Live cameras" variant="modal">
          <p className="mt-0">
            One camera fills the screen. Any other joined camera can sit in a
            corner of it or wait off screen, ready to be cut to without a
            reconnection.
          </p>
          <p className="mb-0">
            Preview opens a floating window of a camera for you alone, so you
            can see what it is pointing at before it reaches the broadcast.
          </p>
        </InfoTip>
      </div>
      <div className="h-2.5" />
      <CameraPanel />
    </section>
  );
};

const RoleCard = ({
  icon: Icon,
  title,
  body,
  cta,
  onClick,
}: {
  icon: typeof Radio;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-5.5 text-left"
  >
    <span className="grid size-11.5 place-items-center rounded-xl border border-border bg-background text-primary-soft">
      <Icon size={22} />
    </span>
    <span className="text-lg font-semibold text-foreground">{title}</span>
    <span className="flex-1 text-[13px] leading-[1.55] text-muted-foreground">
      {body}
    </span>
    <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-primary-soft">
      {cta}
      <ArrowRight size={15} />
    </span>
  </button>
);
