import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Cross,
  FileText,
  Film,
  HelpCircle,
  Image as ImageIcon,
  Keyboard,
  Menu,
  MonitorUp,
  Palette,
  Radio,
  Save,
  Settings,
  WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { APP_NAME } from "../../lib/appInfo";
import { cn } from "../../lib/utils";

const TIPS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Save,
    title: "You decide when to save",
    desc: "Every editor keeps your work as a draft until you save it. The Save button turns blue the moment there is something unsaved, Ctrl+S saves from anywhere in the editor, and leaving a page with unsaved work asks you first. A brand new manuscript is a draft too: nothing joins your library until you save it, so backing out of an empty one leaves nothing behind. Ctrl+Z and Ctrl+Y undo and redo while you edit.",
  },
  {
    icon: FileText,
    title: "Lyrics become slides, then shape them",
    desc: `Paste lyrics (optionally tagged [verse], [chorus] or [bridge]; [solo] counts as a verse too) and ${APP_NAME} builds clean, auto-numbered slides at a size the back row can read, keeping space above and below the words rather than filling the frame. Change the text size and the slides are re-cut to match. From there it's easy to build the flow: split a slide in two, merge it into the next, duplicate, reorder by dragging, or insert a new slide, all from the slide inspector or by right-clicking a slide. You can also drop pictures, clips and free text boxes anywhere on a slide.`,
  },
  {
    icon: BookOpen,
    title: "Project scripture in seconds",
    desc: "Open the Bible tab, pick a version (KJV or ASV), click verses to select them, and hit Present, or save the passage as styled slides you can edit like any manuscript. The full text is built in, so the whole Bible works offline.",
  },
  {
    icon: Film,
    title: "Images, videos and sound",
    desc: "Upload images and videos from their tabs and polish them in the built-in editors: filters, rotate and screen fit for images; trim, volume, speed and set-to-playhead for videos. Sounds get their own editor too, and any video can become a moving background or a slide's audio. Every picker offers your asset library and your Images, Videos and sounds together. Edit an asset in its own editor and later uses start from your changes; edit it from inside a manuscript, passage or slide and the change stays with that one place.",
  },
  {
    icon: MonitorUp,
    title: "Present over HDMI, then fill the screen",
    desc: "Connect a projector or TV, click Present, then Go Live to open the audience window on that screen while the controls and notes stay on yours. Press F11 straight after Go Live to fill the external screen, or use the fullscreen arrow at its top right corner.",
  },
  {
    icon: Palette,
    title: "Themes do the styling for you",
    desc: "A theme is a saved look: font, text color, size, background, animation and even background audio, bundled together. The Themes page works like an editor, with every theme in a scrolling sidebar and the one you picked open beside it. Pick a theme in a manuscript's settings and every slide follows it; built-in themes can be edited but not deleted, and Reset to default puts one back the way it shipped. Any slide can still override the look in its inspector.",
  },
  {
    icon: Radio,
    title: "Put a phone camera on the screen",
    desc: "The Stream tab pairs another device over your WiFi by scanning a QR code or typing a short code. Project the camera full screen, keep a second one in a corner or waiting off screen, preview any of them in a floating window first, and lay text, announcements, pictures or clips over the broadcast. It needs an https address on both devices.",
  },
  {
    icon: WifiOff,
    title: "Install it & use it offline",
    desc: `${APP_NAME} can be installed straight from your browser. Look for Install in the address bar, or "Add to Home Screen" on mobile. It then opens in its own window and runs fully offline; your whole library is saved on the device. Back up or move to another device with Export / Import in Settings.`,
  },
];

const HEADER_ICONS: { icon: LucideIcon; name: string; desc: string }[] = [
  {
    icon: HelpCircle,
    name: "About & Help",
    desc: "The story behind the app, FAQs, and how to reach me.",
  },
  {
    icon: ImageIcon,
    name: "Asset Library",
    desc: "Manage background images, custom colors, and sounds.",
  },
  {
    icon: Palette,
    name: "Themes",
    desc: "Opens the Themes page to create and edit looks: fonts, colors, background, animation, playback.",
  },
  {
    icon: Keyboard,
    name: "Shortcuts",
    desc: "Every keyboard control, grouped by where it works.",
  },
  {
    icon: Settings,
    name: "Settings",
    desc: "Presentation options, transitions, audio, backup, and reset.",
  },
  {
    icon: Menu,
    name: "Menu",
    desc: "Appears only when the screen is too narrow for every icon, and holds whatever did not fit.",
  },
];

export const GuideModal = () => {
  const showGuide = useStore((s) => s.showGuide);
  const completeGuide = useStore((s) => s.completeGuide);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  useEffect(() => {
    const element = bodyRef.current;
    if (
      showGuide &&
      element &&
      element.scrollHeight <= element.clientHeight + 8
    )
      setReachedEnd(true);
  }, [showGuide]);

  return (
    <Dialog open={showGuide}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className="flex max-h-[90vh] max-w-[min(580px,calc(100%-2rem))] flex-col gap-0 overflow-hidden rounded-[18px] p-0 sm:max-w-none"
      >
        <div className="border-b border-border px-6 pt-5.5 pb-4">
          <div className="text-[11px] font-bold tracking-[0.6px] text-primary uppercase">
            Welcome
          </div>
          <DialogTitle className="mt-1 text-[25px] leading-tight">
            A quick tour of {APP_NAME}
          </DialogTitle>
        </div>

        <div
          ref={bodyRef}
          onScroll={(event) => {
            const element = event.currentTarget;
            if (
              element.scrollTop + element.clientHeight >=
              element.scrollHeight - 8
            )
              setReachedEnd(true);
          }}
          className="flex-1 overflow-y-auto p-6"
        >
          <p className="mt-0 text-sm leading-[1.7] text-muted-foreground">
            {APP_NAME} is a light, distraction-free studio for presenting
            manuscripts, scripture, images, videos and live cameras reliably.
            Here are a few things worth knowing before you start.
          </p>

          {TIPS.map((tip) => (
            <div key={tip.title} className="mb-4 flex gap-3.25">
              <div className="grid size-9.5 shrink-0 place-items-center rounded-[10px] bg-primary/14 text-primary-soft">
                <tip.icon size={18} />
              </div>
              <div>
                <div className="text-[14.5px] font-semibold text-foreground">
                  {tip.title}
                </div>
                <div className="mt-0.5 text-[13px] leading-[1.6] text-muted-foreground">
                  {tip.desc}
                </div>
              </div>
            </div>
          ))}

          <h3 className="mt-5.5 mb-3 text-[17px] text-foreground">
            What the header icons do
          </h3>
          {HEADER_ICONS.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3.25 border-b border-border py-2.25"
            >
              <div className="grid size-8.5 shrink-0 place-items-center rounded-[9px] bg-secondary text-foreground">
                <item.icon size={16} />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-foreground">
                  {item.name}
                </div>
                <div className="text-[12.5px] leading-normal text-muted-foreground">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}

          <p className="mt-5 mb-0 text-[13.5px] leading-[1.7] text-muted-foreground">
            That's it, create a manuscript from the dashboard or open the
            library to start. You can revisit all of this anytime under About
            &amp; Help. Welcome aboard.
            <Cross size={13} className="ml-1.25 inline align-middle" />
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-3.5">
          <span
            className={cn(
              "text-[12.5px]",
              reachedEnd ? "text-subtle-foreground" : "text-primary",
            )}
          >
            {reachedEnd ? "You're all set." : "Scroll to the end to continue"}
          </span>
          <Button disabled={!reachedEnd} onClick={completeGuide}>
            Understood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
