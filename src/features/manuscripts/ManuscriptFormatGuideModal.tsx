import { useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, BookOpen, Music } from "lucide-react";
import type { ManuscriptFormat } from "../../types";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { PillTabs } from "../../components/ui/PillTabs";
import type { PillTab } from "../../components/ui/PillTabs";

const FORMAT_TABS: PillTab<ManuscriptFormat>[] = [
  { id: "song", label: "Song", icon: Music },
  { id: "sermon", label: "Sermon", icon: BookOpen },
];

interface ManuscriptFormatGuideModalProps {
  open: boolean;
  onClose: () => void;
  format: ManuscriptFormat;
}

export const ManuscriptFormatGuideModal = ({
  open,
  onClose,
  format,
}: ManuscriptFormatGuideModalProps) => {
  const [tab, setTab] = useState<ManuscriptFormat>(format);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Formatting guide"
      width={600}
      footer={
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <GuideSection title="Titles and collections">
        Paste the text as it comes. Open with <Mark>HYMN: Ancient Words</Mark>,{" "}
        <Mark>SONG: Way Maker</Mark> or <Mark>SERMON: Grace</Mark> and that line
        names the manuscript and files it in the matching collection instead of
        becoming a slide.
      </GuideSection>

      <div className="mt-1 mb-3.5">
        <PillTabs<ManuscriptFormat>
          tabs={FORMAT_TABS}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "song" ? (
        <>
          <GuideSection title="Sections">
            Sections are picked up however they are written:{" "}
            <Mark>[Chorus]</Mark>, <Mark>## Chorus</Mark>,{" "}
            <Mark>**Chorus**</Mark>, <Mark>Chorus:</Mark>,{" "}
            <Mark>Chorus: first line</Mark> or a bare <Mark>Bridge</Mark>.
            Performer cues like <Mark>Soloist:</Mark> and <Mark>Choir:</Mark>{" "}
            are kept too.
          </GuideSection>
          <GuideSection title="Verses and numbering">
            Untagged stanzas become verses. A stanza opening <Mark>1.</Mark>{" "}
            <Mark>(2)</Mark> or <Mark>IV.</Mark> is numbered by it: the number
            labels the slide instead of standing in front of the lyric.
          </GuideSection>
          <GuideSection title="Hymnbook text">
            Hymnal exports drop straight in. <Mark>Verse 1:</Mark> and{" "}
            <Mark>Refrain:</Mark> headings become slides, an{" "}
            <Mark>Author:</Mark> line anywhere in the text fills the author
            instead of becoming a lyric, tune cues such as <Mark>@e1</Mark> and{" "}
            <Mark>Road Map:</Mark> lines are dropped, and singing hyphens in{" "}
            <Mark>a-bide with me</Mark> are closed up so the words read and
            search whole.
          </GuideSection>
          <GuideSection title="Repeats">
            Repeat marks never reach the screen. <Mark>(2x)</Mark>{" "}
            <Mark>/2ce</Mark> and <Mark>[4x]</Mark> move into the presenter
            notes, and a cue pointing elsewhere, such as{" "}
            <Mark>Repeat Chorus (3x)</Mark>, a trailing <Mark>[Refrain]</Mark>{" "}
            or an empty <Mark>Chorus:</Mark>, adds a repeat note instead of
            building the slide twice.
          </GuideSection>
        </>
      ) : (
        <>
          <GuideSection title="Title slide">
            The topic, the passage and the preacher open the deck on a title
            slide. Write them as <Mark>Text: John 3:16</Mark>,{" "}
            <Mark>Preacher: Pastor Ada</Mark> or <Mark>By Pastor Ada</Mark>{" "}
            under the heading.
          </GuideSection>
          <GuideSection title="Points">
            Points keep their own heading, whether written{" "}
            <Mark>## The Cross</Mark>, <Mark>**The Cross**</Mark>,{" "}
            <Mark>THE CROSS</Mark>, <Mark>Introduction:</Mark> or{" "}
            <Mark>1. The Cross</Mark>.
          </GuideSection>
          <GuideSection title="Paragraphs">
            Paragraphs stay whole. A blank line starts a new one, wrapped lines
            are rejoined, and a paragraph too long for one slide carries on at a
            sentence break rather than being cut mid-thought.
          </GuideSection>
        </>
      )}

      <GuideSection title="Emphasis and lists">
        Emphasis is written as plain text: <Mark>**bold**</Mark>{" "}
        <Mark>*italic*</Mark> <Mark>++underline++</Mark>{" "}
        <Mark>~~strikethrough~~</Mark> <Mark>==highlight==</Mark>. So are lists:{" "}
        <Mark>- point</Mark> <Mark>1. point</Mark> <Mark>a. point</Mark>{" "}
        <Mark>i. point</Mark>. Tab and Shift+Tab move a point in and out to
        build sub-points. Once the slides are built, format them by highlighting
        the words on the slide itself.
      </GuideSection>

      <RegenerateWarning />
    </Modal>
  );
};

const GuideSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="mb-3.5">
    <h4 className="mt-0 mb-1.25 text-[13px] font-semibold text-fg">{title}</h4>
    <p className="m-0 text-[12.5px] leading-[1.65] text-sub">{children}</p>
  </section>
);

const Mark = ({ children }: { children: ReactNode }) => (
  <code className="text-accent-soft">{children}</code>
);

const RegenerateWarning = () => (
  <div
    role="note"
    className="flex items-start gap-2.25 rounded-[11px] border border-danger/42 bg-danger/15 px-3 py-2.5 text-[12.5px] leading-[1.55] text-danger-fg"
  >
    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
    Regenerating rebuilds every slide from the text and resets per-slide styling
    and overrides.
  </div>
);
