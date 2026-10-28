import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";

const paragraphClassName = "mt-0 mb-3 text-[13.5px] leading-[1.7] text-sub";

export const QuickConnectNote = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p className="mt-3.5 mb-0 text-center text-[12.5px] leading-normal text-dim">
        A brief internet connection is needed to link both devices.{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-none bg-transparent p-0 text-accent-soft underline [font:inherit]"
        >
          Learn more
        </button>
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Why quick connect needs the internet"
        width={480}
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            Got it
          </Button>
        }
      >
        <p className={paragraphClassName}>
          Quick connect lets the two devices find each other on their own, and
          that introduction is made through a short online lookup. Both devices
          need to reach the internet for those few seconds.
        </p>
        <p className={paragraphClassName}>
          Once they are paired the video no longer goes online. It travels
          straight between the two devices over your WiFi, so the picture keeps
          running even if the internet drops out afterwards.
        </p>
        <p className="m-0 text-[13.5px] leading-[1.7] text-fg">
          No internet? Choose <strong>Pair with a code instead</strong>. That
          route is fully offline: point one device at the other&apos;s QR code,
          or copy the code text and paste it into the box on the other device.
        </p>
      </Modal>
    </>
  );
};
