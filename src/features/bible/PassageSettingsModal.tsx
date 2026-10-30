import { useValueChange } from "@/hooks/useValueChange";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { BibleVersionId, ScripturePassage } from "../../types";
import {
  BIBLE_BOOKS,
  BIBLE_VERSIONS,
  DEFAULT_BIBLE_VERSION,
  bookById,
  isBibleVersion,
} from "../../data/bibleBooks";
import { useStore } from "../../store/useStore";
import { Modal } from "@/components/shared/Modal";
import { InfoTip } from "@/components/shared/InfoTip";
import { Button } from "@/components/ui/button";
import { Field, SectionTitle } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { SwitchField } from "@/components/shared/SwitchField";
import { StyleControls } from "../../components/controls/StyleControls";
import { BackgroundPicker } from "../../components/controls/BackgroundPicker";
import { AudioPicker } from "../../components/controls/AudioPicker";
import { AnimationPicker } from "../../components/controls/AnimationPicker";
import {
  resolveAudioSettings,
  resolveAutoPlay,
  resolveBackgroundImage,
  resolveBackgroundVideo,
  resolveLoopSlides,
  resolveSlideDuration,
  resolveStyle,
} from "../../lib/resolve";
import { findBackgroundClip } from "../../lib/media";
import { useMediaLibrary } from "../../hooks/useMediaLibrary";
import { getChapterVerses } from "./lib/offlineBible";
import type { AssetUsageRequest } from "../../lib/assetUsage";
import type { DeckEditor } from "../editor/useDeckEditor";
import { PlaybackSettings } from "../../components/controls/PlaybackSettings";

interface PassageSettingsModalProps {
  open: boolean;
  onClose: () => void;
  passage: ScripturePassage;
  editor: DeckEditor;
  onEditAsset: (request: AssetUsageRequest) => void;
}

export const PassageSettingsModal = ({
  open,
  onClose,
  passage,
  editor,
  onEditAsset,
}: PassageSettingsModalProps) => {
  const themes = useStore((s) => s.themes);
  const backgrounds = useStore((s) => s.backgrounds);
  const audio = useStore((s) => s.audio);
  const library = useMediaLibrary();
  const addCustomBackground = useStore((s) => s.addCustomBackground);
  const rebuildScriptureSlides = useStore((s) => s.rebuildScriptureSlides);
  const pushToast = useStore((s) => s.pushToast);

  const safeVersion = (value: BibleVersionId) =>
    isBibleVersion(value) ? value : DEFAULT_BIBLE_VERSION;
  const [version, setVersion] = useState<BibleVersionId>(
    safeVersion(passage.version),
  );
  const [bookId, setBookId] = useState(passage.range.bookId);
  const [chapter, setChapter] = useState(passage.range.chapter);
  const [verseStart, setVerseStart] = useState(passage.range.verseStart);
  const [verseEnd, setVerseEnd] = useState(passage.range.verseEnd);
  const [versesPerSlide, setVersesPerSlide] = useState(passage.versesPerSlide);
  const [showVerseNumbers, setShowVerseNumbers] = useState(
    passage.showVerseNumbers,
  );
  const [showReference, setShowReference] = useState(passage.showReference);
  const [rebuilding, setRebuilding] = useState(false);

  useValueChange(open ? passage : null, (editing) => {
    if (!editing) return;
    setVersion(safeVersion(editing.version));
    setBookId(editing.range.bookId);
    setChapter(editing.range.chapter);
    setVerseStart(editing.range.verseStart);
    setVerseEnd(editing.range.verseEnd);
    setVersesPerSlide(editing.versesPerSlide);
    setShowVerseNumbers(editing.showVerseNumbers);
    setShowReference(editing.showReference);
  });

  const book = bookById(bookId);
  const theme = useMemo(
    () => themes.find((t) => t.id === passage.defaultThemeId) || themes[0],
    [themes, passage.defaultThemeId],
  );
  const themeAudio = theme.defaultAudioId
    ? audio.find((a) => a.id === theme.defaultAudioId)
    : undefined;
  const themeBackground = backgrounds.find(
    (bg) => bg.id === theme.backgroundId,
  );
  const effectiveBackground = backgrounds.find(
    (bg) => bg.id === (passage.defaultBackgroundId || theme.backgroundId),
  );
  const backgroundVideoItem = findBackgroundClip(
    library,
    effectiveBackground?.mediaId,
  );
  const backgroundImage = effectiveBackground
    ? resolveBackgroundImage(undefined, passage, effectiveBackground)
    : null;
  const backgroundVideo = effectiveBackground
    ? resolveBackgroundVideo(
        undefined,
        passage,
        effectiveBackground,
        backgroundVideoItem,
      )
    : null;
  const passageAudio = audio.find(
    (item) => item.id === (passage.defaultAudioId || ""),
  );

  const rangeError =
    verseStart > verseEnd
      ? "The first verse has to come before the last one."
      : null;

  const rebuild = async () => {
    if (!book) return;
    if (rangeError) {
      pushToast(rangeError, "error");
      return;
    }
    setRebuilding(true);
    try {
      const chapterVerses = await getChapterVerses(version, bookId, chapter);
      const verses = chapterVerses.filter(
        (v) => v.v >= verseStart && v.v <= verseEnd,
      );
      if (!verses.length) {
        pushToast("That verse range is empty in this chapter.", "error");
        return;
      }
      rebuildScriptureSlides(passage.id, {
        version,
        range: {
          bookId,
          bookName: book.name,
          chapter,
          verseStart: verses[0].v,
          verseEnd: verses[verses.length - 1].v,
        },
        verses,
        versesPerSlide,
        showVerseNumbers,
        showReference,
      });
      editor.setSelectedId(null);
      pushToast("Slides rebuilt from the passage.");
      onClose();
    } catch (err) {
      pushToast((err as Error).message, "error");
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Passage Settings"
      width={620}
      info={
        <InfoTip title="Passage settings">
          These settings apply to every slide in this passage. Individual slides
          can still override them in the inspector.
        </InfoTip>
      }
    >
      <SectionTitle>Passage</SectionTitle>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <Field label="Version">
          <OptionSelect
            value={version}
            options={BIBLE_VERSIONS.map((v) => ({ value: v.id, label: v.id }))}
            onValueChange={(next) => setVersion(next as BibleVersionId)}
          />
        </Field>
        <Field label="Book">
          <OptionSelect
            value={String(bookId)}
            options={BIBLE_BOOKS.map((b) => ({
              value: String(b.id),
              label: b.name,
            }))}
            onValueChange={(next) => {
              setBookId(Number(next));
              setChapter(1);
            }}
          />
        </Field>
        <Field label="Chapter">
          <OptionSelect
            value={String(chapter)}
            options={Array.from({ length: book?.chapters || 1 }, (_, i) =>
              String(i + 1),
            )}
            onValueChange={(next) => setChapter(Number(next))}
          />
        </Field>
        <Field label="Verses (from – to)" error={rangeError}>
          <div className="flex gap-2">
            <OptionSelect
              value={String(verseStart)}
              options={Array.from({ length: 176 }, (_, i) => String(i + 1))}
              onValueChange={(next) => setVerseStart(Number(next))}
            />
            <OptionSelect
              value={String(verseEnd)}
              options={Array.from({ length: 176 }, (_, i) => String(i + 1))}
              onValueChange={(next) => setVerseEnd(Number(next))}
            />
          </div>
        </Field>
      </div>

      <SectionTitle>Slide Format</SectionTitle>
      <Field label={`Verses per slide (${versesPerSlide})`}>
        <RangeSlider
          value={versesPerSlide}
          min={1}
          max={6}
          onValueChange={(next) => setVersesPerSlide(next)}
        />
      </Field>
      <div className="mb-2">
        <SwitchField
          label="Show verse numbers"
          checked={showVerseNumbers}
          onChange={setShowVerseNumbers}
        />
      </div>
      <div className="mb-3">
        <SwitchField
          label="Show reference on each slide"
          checked={showReference}
          onChange={setShowReference}
        />
      </div>
      <Button
        onClick={() => void rebuild()}
        busy={rebuilding}
        disabled={Boolean(rangeError)}
        title={rangeError ?? "Rebuild this passage from its verses"}
      >
        <RefreshCw size={15} />
        Apply & rebuild slides
      </Button>
      <p className="mt-2.5 mb-0 text-xs text-destructive opacity-85">
        Rebuilding refetches the verses and resets per-slide overrides.
      </p>

      <SectionTitle>Theme</SectionTitle>
      <Field label="Theme">
        <OptionSelect
          value={passage.defaultThemeId}
          options={themes.map((t) => ({ value: t.id, label: t.name }))}
          onValueChange={(next) => editor.patchDoc({ defaultThemeId: next })}
        />
      </Field>

      <SectionTitle>Text</SectionTitle>
      <StyleControls
        style={resolveStyle(undefined, passage, theme)}
        onChange={(key, value) => editor.updateDocStyle(key, value)}
      />

      <SectionTitle>Background</SectionTitle>
      <BackgroundPicker
        backgrounds={backgrounds}
        value={passage.defaultBackgroundId || ""}
        highlightId={passage.defaultBackgroundId || theme.backgroundId}
        inherit={{
          label: `Use theme (${theme.name})`,
          background: themeBackground,
        }}
        onSelect={(id, image) =>
          editor.patchDoc({
            defaultBackgroundId: id,
            defaultBackgroundImage: image,
          })
        }
        onUploaded={(id, image) =>
          editor.patchDoc({
            defaultBackgroundId: id,
            defaultBackgroundImage: image,
          })
        }
        onAddColor={(value, name) =>
          editor.patchDoc({
            defaultBackgroundId: addCustomBackground(value, name),
          })
        }
        imageSettings={backgroundImage}
        videoSettings={backgroundVideo}
        onEditUsage={onEditAsset}
      />

      <SectionTitle>Audio</SectionTitle>
      <AudioPicker
        audio={audio}
        value={passage.defaultAudioId || ""}
        inheritLabel={
          themeAudio ? `Use theme audio (${themeAudio.name})` : undefined
        }
        onSelect={(id) => editor.patchDoc({ defaultAudioId: id || null })}
        onUploaded={(id) => editor.patchDoc({ defaultAudioId: id })}
        settings={
          passageAudio
            ? resolveAudioSettings(undefined, passage, passageAudio)
            : undefined
        }
        onEditUsage={onEditAsset}
      />

      <SectionTitle>Animation</SectionTitle>
      <AnimationPicker
        value={passage.animation || ""}
        inheritLabel="Use theme / app default"
        onSelect={(value) =>
          editor.patchDoc({
            animation: (value || undefined) as ScripturePassage["animation"],
          })
        }
      />

      <PlaybackSettings
        autoPlay={resolveAutoPlay(passage, theme)}
        loopSlides={resolveLoopSlides(passage, theme)}
        seconds={resolveSlideDuration(passage, theme)}
        info="With auto-play on, the passage advances on its own after the seconds set here, and looping starts it again from the first slide. With it off, slides change only when you navigate."
        onChange={editor.patchDoc}
      />
    </Modal>
  );
};
