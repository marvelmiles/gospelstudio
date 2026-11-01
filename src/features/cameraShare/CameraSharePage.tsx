import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ShieldAlert, Smartphone } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import routes from "../../routes";
import { Button } from "@/components/ui/button";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { QrCode } from "../pairing/QrCode";
import {
  readCameraLink,
  type CameraLinkRequest,
} from "../pairing/lib/cameraLink";
import { CameraShareLobby } from "./CameraShareLobby";

const SUBTITLE = "Use this device as a live camera in the Studio.";
const PHONE_QR_SIZE = 200;

const isLinked = (link: CameraLinkRequest): boolean =>
  Boolean(link.studio || link.offerCode);

export const CameraSharePage = () => {
  usePageMeta("camera");
  const navigate = useNavigate();
  const [link] = useState(() => readCameraLink(new URL(window.location.href)));
  const [isSharing, setIsSharing] = useState(() => isLinked(link));

  useEffect(() => {
    if (isLinked(link)) navigate(routes.cameraShare(), { replace: true });
  }, [link, navigate]);

  return (
    <div className={pageClassName}>
      <PageHeader title="Share a camera" subtitle={SUBTITLE} />
      {!window.isSecureContext ? (
        <SecureConnectionNotice />
      ) : isSharing ? (
        <CameraShareLobby link={link} onStop={() => setIsSharing(false)} />
      ) : (
        <ShareIntro onStart={() => setIsSharing(true)} />
      )}
    </div>
  );
};

const ShareIntro = ({ onStart }: { onStart: () => void }) => (
  <div className="mx-auto grid max-w-190 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
    <Panel className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
      <span className="grid size-13 place-items-center rounded-2xl bg-primary/14 text-primary-soft">
        <Camera size={24} />
      </span>
      <h2 className="m-0 text-lg font-semibold text-foreground">
        Share this camera with the Studio
      </h2>
      <p className="m-0 max-w-100 text-[13.5px] leading-relaxed text-muted-foreground">
        Press Start sharing, then pick this device in the Studio&apos;s camera
        window under Another device.
      </p>
      <Button onClick={onStart} className="mt-1">
        <Camera />
        Start sharing
      </Button>
    </Panel>
    <Panel className="hidden h-full flex-col md:flex">
      <PanelTitle
        icon={Smartphone}
        title="Use a phone instead"
        info="Scan this with the phone's camera app. It opens this page on the phone, ready to share its camera."
      />
      <div className="grid flex-1 place-items-center">
        <QrCode
          value={new URL(routes.cameraShare(), window.location.origin).href}
          size={PHONE_QR_SIZE}
          caption="Open on a phone"
        />
      </div>
    </Panel>
  </div>
);

const SecureConnectionNotice = () => (
  <div className="mx-auto mt-10 max-w-140 rounded-2xl border border-border bg-secondary p-6 text-center">
    <ShieldAlert size={30} className="mx-auto mb-3 text-destructive" />
    <div className="mb-2 text-lg font-semibold text-foreground">
      Sharing a camera needs a secure connection
    </div>
    <p className="m-0 text-[13.5px] leading-[1.6] text-muted-foreground">
      Cameras only open on an <strong>https://</strong> address (or localhost).
      Open this app over https on both devices and try again.
    </p>
  </div>
);
