import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { ContentKind, SlideDeckDoc } from "../../types";
import { useStore } from "../../store/useStore";
import { useWindowSize } from "usehooks-ts";
import { useBgMap } from "../../hooks/useBgMap";
import { useBackgroundView } from "../../hooks/useBackgroundView";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useValidation } from "../../hooks/useValidation";
import {
  useUnsavedChanges,
  UNSAVED_CHANGES_MESSAGE,
} from "../../hooks/useUnsavedChanges";
import {
  resolveAnimation,
  resolveLineStyle,
  resolveStyle,
} from "../../lib/resolve";
import { computeTagGroups } from "../../lib/tagGroups";
import { slideTextMetrics, type SlideTextMetrics } from "../../lib/slideLayout";
import type { ReflowOptions } from "../../lib/slideReflow";
import { validateName } from "../../lib/validation";
import { DEFAULT_SLIDE_ELEMENTS } from "../../lib/slideElements";
import type { SlideElementCapabilities } from "../../lib/slideElements";
import { EditorTopBar } from "../../components/layout/EditorTopBar";
import {
  EditorColumns,
  EditorStackedBody,
} from "../../components/layout/EditorColumns";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useOpenAssetUsageEditor } from "../assets/assetUsageEdit";
import type { DeckEditor } from "./useDeckEditor";
import { useFollowPresentation } from "./useFollowPresentation";
import { useRefitOnTextSize } from "./useRefitOnTextSize";
import { SlideListPanel } from "./SlideListPanel";
import { PreviewPanel } from "./PreviewPanel";
import { InspectorPanel } from "./InspectorPanel";
import { slideMenuItems } from "./deckWorkspace/slideMenuItems";
import { useSlideElementEditing } from "./deckWorkspace/useSlideElementEditing";
import { useSlideTextSurface } from "./deckWorkspace/useSlideTextSurface";
import {
  WorkspaceTabBar,
  type WorkspaceTab,
} from "./deckWorkspace/WorkspaceTabBar";

const STACKED_WIDTH = 1080;
const COMPACT_WIDTH = 560;

const DOCUMENT_NOUN: Partial<Record<ContentKind, string>> = {
  manuscript: "manuscript",
  scripture: "passage",
};

const TITLE_LABEL: Partial<Record<ContentKind, string>> = {
  manuscript: "manuscript title",
  scripture: "passage title",
};

interface DeckWorkspaceProps {
  doc: SlideDeckDoc;
  kind: ContentKind;
  editor: DeckEditor;
  backTo: string;
  backTitle: string;
  topBarActions: (compact: boolean) => ReactNode;
  emptyState: ReactNode;
  elements?: SlideElementCapabilities;
  reflow?: ReflowOptions;
  refit?: (metrics: SlideTextMetrics) => boolean;
  unsavedMessage?: string;
  children?: ReactNode;
}

export const DeckWorkspace = ({
  doc,
  kind,
  editor,
  backTo,
  backTitle,
  topBarActions,
  emptyState,
  elements = DEFAULT_SLIDE_ELEMENTS,
  reflow,
  refit,
  unsavedMessage = UNSAVED_CHANGES_MESSAGE,
  children,
}: DeckWorkspaceProps) => {
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isStacked = width < STACKED_WIDTH;
  useDocumentTitle(doc.title);

  const themes = useStore((s) => s.themes);
  const backgrounds = useStore((s) => s.backgrounds);
  const audio = useStore((s) => s.audio);
  const startPresent = useStore((s) => s.startPresent);
  const updatePresentation = useStore((s) => s.updatePresentation);
  const presentation = useStore((s) => s.presentation);
  const pushToast = useStore((s) => s.pushToast);
  const defaultAnimation = useStore((s) => s.prefs.transition);
  const [animationReplay, setAnimationReplay] = useState(0);

  const [tab, setTab] = useState<WorkspaceTab>("edit");

  const tagGroups = useMemo(
    () => computeTagGroups(editor.slides),
    [editor.slides],
  );
  const theme = useMemo(
    () => themes.find((entry) => entry.id === doc.defaultThemeId) || themes[0],
    [themes, doc.defaultThemeId],
  );
  const bgMap = useBgMap();

  const {
    fontSize: docFontSize,
    lineHeight: docLineHeight,
    fontFamily: docFontFamily,
    fontWeight: docFontWeight,
    letterSpacing: docLetterSpacing,
    uppercase: docUppercase,
  } = resolveStyle(undefined, doc, theme);
  const textMetrics = useMemo(
    () =>
      slideTextMetrics({
        fontSize: docFontSize,
        lineHeight: docLineHeight,
        fontFamily: docFontFamily,
        fontWeight: docFontWeight,
        letterSpacing: docLetterSpacing,
        uppercase: docUppercase,
      }),
    [
      docFontSize,
      docLineHeight,
      docFontFamily,
      docFontWeight,
      docLetterSpacing,
      docUppercase,
    ],
  );
  useRefitOnTextSize({
    metrics: textMetrics,
    reflow,
    refit: refit ?? editor.refitSlides,
    onRefit: () =>
      pushToast("Slides re-cut so the text keeps its space on screen."),
  });

  const documentNoun = DOCUMENT_NOUN[kind] ?? "document";
  const openAssetUsage = useOpenAssetUsageEditor({ kind, doc, editor });

  const leaveGuard = useUnsavedChanges(editor.dirty);
  const validation = useValidation({
    title: validateName(doc.title, TITLE_LABEL[kind] ?? "title"),
  });

  const slide = editor.selectedSlide;
  const slideId = slide?.id ?? null;
  const elementEditing = useSlideElementEditing(editor, slideId);
  const textSurface = useSlideTextSurface(
    editor,
    slide,
    elementEditing.pickedTextBoxId,
  );

  useFollowPresentation(kind, doc.id, editor.slides, editor.setSelectedId);

  const previewBackground = useBackgroundView(slide, doc, theme, bgMap);
  const isPresentingThisDoc =
    presentation?.kind === kind && presentation.id === doc.id;

  const present = ({ live }: { live: boolean }) =>
    startPresent(kind, doc.id, Math.max(0, editor.selectedIndex), {
      live,
      doc,
    });

  const refuseInvalid = () =>
    pushToast(validation.message ?? "Fix the highlighted fields.", "error");

  const handleSave = () => {
    if (validation.invalid) {
      refuseInvalid();
      return;
    }
    if (editor.save()) pushToast("Changes saved.");
  };

  const handleUpdatePresentation = () => {
    if (validation.invalid) {
      refuseInvalid();
      return;
    }
    if (updatePresentation(kind, doc)) pushToast("Presentation updated.");
  };

  const listPanel = (
    <SlideListPanel
      slides={editor.slides}
      selectedId={editor.selectedId}
      setSelectedId={(id) => {
        editor.setSelectedId(id);
        textSurface.setLineScope(false);
        if (isStacked) setTab("edit");
      }}
      doc={doc}
      theme={theme}
      bgMap={bgMap}
      onReorder={editor.setSlides}
      slideMenuItems={(index) => slideMenuItems(editor, index)}
      onAdd={() =>
        editor.insertSlideAt(
          editor.selectedIndex >= 0
            ? editor.selectedIndex + 1
            : editor.slides.length,
        )
      }
      tagGroups={tagGroups}
    />
  );

  const previewPanel = slide ? (
    <PreviewPanel
      slide={slide}
      animation={resolveAnimation(slide, doc, theme, defaultAnimation)}
      animationReplay={animationReplay}
      elementEditing={elementEditing.editing}
      style={resolveStyle(slide, doc, theme)}
      lineStyles={slide.lines.map((_, index) =>
        resolveLineStyle(slide, index, doc, theme),
      )}
      background={previewBackground.background}
      backgroundImage={previewBackground.image}
      backgroundVideo={previewBackground.video}
      text={textSurface.text}
      formatting={textSurface.formatting}
      onChangeLabel={(label) =>
        editor.updateSlide(
          slide.id,
          { label },
          { coalesceKey: `label:${slide.id}` },
        )
      }
      selectedLine={textSurface.selectedLine}
      activeTextBoxId={textSurface.activeTextBoxId}
      onActivateTextBox={elementEditing.activateTextBox}
    />
  ) : (
    emptyState
  );

  const inspectorPanel = slide ? (
    <InspectorPanel
      editor={editor}
      doc={doc}
      theme={theme}
      backgrounds={backgrounds}
      audio={audio}
      documentNoun={documentNoun}
      selectedLine={textSurface.selectedLine}
      onScopeToLine={textSurface.setLineScope}
      formatting={textSurface.formatting}
      selectedElement={elementEditing.selectedElement}
      onSelectElement={elementEditing.selectElement}
      activeTextBoxId={textSurface.activeTextBoxId}
      elements={elements}
      onAddTextBox={elementEditing.addTextBox}
      onPreviewAnimation={() => setAnimationReplay((count) => count + 1)}
      onEditAsset={(request, forSlideId) =>
        openAssetUsage(request, {
          label: forSlideId ? "this slide" : `this ${documentNoun}`,
          slideId: forSlideId,
        })
      }
    />
  ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorTopBar
        title={doc.title}
        compact={width < COMPACT_WIDTH}
        backTitle={backTitle}
        onBack={() => navigate(backTo)}
        onTitle={(title) =>
          editor.patchDoc({ title }, { coalesceKey: "title" })
        }
        onPresent={present}
        actions={topBarActions(width < COMPACT_WIDTH)}
        dirty={editor.dirty}
        titleError={validation.messageFor("title")}
        invalid={validation.invalid}
        invalidReason={validation.message}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={textSurface.formatting.undo}
        onRedo={textSurface.formatting.redo}
        onSave={handleSave}
        onUpdatePresentation={
          isPresentingThisDoc ? handleUpdatePresentation : undefined
        }
      />

      {isStacked ? (
        <>
          <WorkspaceTabBar
            tab={tab}
            onChange={setTab}
            hasSlide={Boolean(slide)}
          />
          <EditorStackedBody>
            {tab === "slides" && listPanel}
            {tab === "edit" && previewPanel}
            {tab === "style" && (inspectorPanel || emptyState)}
          </EditorStackedBody>
        </>
      ) : (
        <EditorColumns
          list={listPanel}
          preview={previewPanel}
          inspector={inspectorPanel}
        />
      )}

      <ConfirmDialog
        open={leaveGuard.prompting}
        title="Unsaved changes"
        message={unsavedMessage}
        confirmLabel="Leave without saving"
        onConfirm={leaveGuard.discard}
        onCancel={leaveGuard.cancel}
      />

      {children}
    </div>
  );
};
