import { Heart, Mail } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Modal } from "@/components/shared/Modal";
import { APP_NAME, APP_VERSION_LABEL } from "../../lib/appInfo";
import { SectionTitle } from "@/components/shared/Field";
import { FAQ_GROUPS } from "./faqs";
import { FaqList } from "./FaqList";

const CONTACT_EMAIL = "marvellousabidemi2@gmail.com";

const bodyClassName = "mt-0 text-[13.5px] leading-[1.7] text-muted-foreground";

export const AboutModal = () => {
  const overlay = useStore((s) => s.overlay);
  const close = useStore((s) => s.closeOverlay);

  return (
    <Modal
      open={overlay === "about"}
      onClose={close}
      title={
        <span>
          About & Help{" "}
          <span className="text-xs text-subtle-foreground">
            {APP_VERSION_LABEL}
          </span>
        </span>
      }
      width={640}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.6px] text-primary uppercase">
        <Heart size={14} /> Why {APP_NAME}
      </div>
      <p className="mt-2.5 text-sm leading-[1.7] text-foreground">
        I started {APP_NAME} because of a real problem at my church. I was
        running the media, and the slide program we used kept freezing in the
        middle of the service. Hymns, pictures and videos would stutter just
        when people needed to read along. Every freeze made people trust the
        media team a little less, and pulled their attention away from worship.
      </p>
      <p className="mt-2.5 text-sm leading-[1.7] text-muted-foreground">
        So I built something lighter, made for one job: showing worship content
        clearly, without freezing. It works without internet, keeps everything
        on your own device, and is simple enough for any volunteer to use.
      </p>

      <SectionTitle>Frequently Asked Questions</SectionTitle>
      <FaqList groups={FAQ_GROUPS} />

      <SectionTitle>Bible Text &amp; Licensing</SectionTitle>
      <p className={bodyClassName}>
        {APP_NAME} comes with two Bible translations: the{" "}
        <strong className="text-foreground">King James Version (KJV)</strong>{" "}
        and the{" "}
        <strong className="text-foreground">
          American Standard Version (ASV, 1901)
        </strong>
        . Both are in the{" "}
        <strong className="text-foreground">public domain</strong>. That means
        they belong to everyone, and you are free to read, show, copy and share
        them. Your church does not need any permission or licence to use them.
        The one exception is the KJV in the United Kingdom, where the Crown
        still holds the printing rights.
      </p>
      <p className={bodyClassName}>
        The Bible text comes from{" "}
        <a
          href="https://www.npmjs.com/package/holy-bible"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary-soft"
        >
          holy-bible
        </a>
        , a free, open-source library shared under the MIT License. Newer
        translations such as the NIV, ESV, NLT and NKJV are protected by
        copyright and cannot be shared freely, so {APP_NAME} does not include
        them.
      </p>

      <SectionTitle>Contact</SectionTitle>
      <p className="mt-0 mb-4 text-[13.5px] leading-[1.6] text-muted-foreground">
        Found a bug, have an idea, or want to tell me how your church uses{" "}
        {APP_NAME}? I would love to hear from you.
      </p>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="inline-flex items-center gap-2.25 rounded-[11px] bg-linear-140 from-primary-soft to-primary px-4 py-2.75 text-sm font-semibold text-white no-underline"
      >
        <Mail size={16} />
        {CONTACT_EMAIL}
      </a>
    </Modal>
  );
};
