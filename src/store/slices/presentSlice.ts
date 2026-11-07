import type {
  ContentKind,
  MediaItem,
  PresentTarget,
  SlideDeckDoc,
} from "../../types";
import { presentLiveWindow } from "../../lib/liveWindow";
import { trackPresentedContent } from "../../lib/analytics/presentedContent";
import type { MediaPlayback, MediaSync } from "../../lib/presentChannel";
import type { SliceCreator } from "../storeTypes";

type PresentationMode = "stage" | "pip";

interface PresentedDeck {
  kind: ContentKind;
  id: string;
  doc?: SlideDeckDoc;
  item?: MediaItem;
}

const pinnedContent = (
  kind: ContentKind,
  doc: SlideDeckDoc | undefined,
  item: MediaItem | undefined,
): PresentedDeck | null =>
  doc ? { kind, id: doc.id, doc } : item ? { kind, id: item.id, item } : null;

export interface PresentedMedia {
  playback: MediaPlayback;
  sync: MediaSync;
}

export interface PresentStartOptions {
  live?: boolean;
  doc?: SlideDeckDoc;
  item?: MediaItem;
}

interface HeldLivePresentation {
  target: PresentTarget;
  index: number;
  mode: PresentationMode;
  deck: PresentedDeck | null;
}

let presentationSessions = 0;
const nextSession = (): number => ++presentationSessions;

export interface PresentSlice {
  presentation: PresentTarget | null;
  presentationMode: PresentationMode;
  presentationIndex: number;
  presentedDeck: PresentedDeck | null;
  presentedMedia: PresentedMedia | null;
  heldLivePresentation: HeldLivePresentation | null;

  startPresent: (
    kind: ContentKind,
    id: string,
    startIndex?: number,
    options?: PresentStartOptions,
  ) => void;
  markPresentationLive: () => void;
  leavePresentation: () => void;
  setPresentationMode: (mode: PresentationMode) => void;
  setPresentationIndex: (index: number) => void;
  updatePresentation: (kind: ContentKind, doc: SlideDeckDoc) => boolean;
  updateMediaPresentation: (item: MediaItem) => boolean;
  publishPresentedMedia: (state: PresentedMedia | null) => void;

  stopPresent: () => void;
}

const holdLivePresentation = (
  state: PresentSlice,
): HeldLivePresentation | null =>
  state.presentation?.live && presentLiveWindow.getState().isLive
    ? {
        target: state.presentation,
        index: state.presentationIndex,
        mode: state.presentationMode,
        deck: state.presentedDeck,
      }
    : null;

export const createPresentSlice: SliceCreator<PresentSlice> = (set, get) => ({
  presentation: null,
  presentationMode: "stage",
  presentationIndex: 0,
  presentedDeck: null,
  presentedMedia: null,
  heldLivePresentation: null,

  startPresent: (kind, id, startIndex = 0, options = {}) => {
    const { live = false } = options;
    const state = get();
    const deckDoc =
      kind === "manuscript" || kind === "scripture"
        ? (options.doc ??
          (kind === "manuscript"
            ? state.manuscripts.find((m) => m.id === id)
            : state.scriptures.find((s) => s.id === id)))
        : undefined;
    const mediaItem =
      kind === "image" || kind === "video"
        ? (options.item ??
          state.media.find((m) => m.id === id && m.kind === kind))
        : undefined;
    const canPresent =
      kind === "manuscript" || kind === "scripture"
        ? Boolean(deckDoc?.slides?.length)
        : Boolean(mediaItem);
    if (!canPresent) return;
    set({
      presentation: { kind, id, startIndex, live, session: nextSession() },
      presentationMode: live ? "pip" : "stage",
      presentationIndex: startIndex,
      presentedDeck: pinnedContent(kind, deckDoc, mediaItem),
      presentedMedia: null,
      heldLivePresentation: live
        ? null
        : (state.heldLivePresentation ?? holdLivePresentation(state)),
    });
    trackPresentedContent(kind);
  },

  markPresentationLive: () => {
    const { presentation } = get();
    if (!presentation || presentation.live) return;
    set({
      presentation: { ...presentation, live: true },
      heldLivePresentation: null,
    });
  },

  leavePresentation: () => {
    const held = get().heldLivePresentation;
    if (!held || !presentLiveWindow.getState().isLive) {
      get().stopPresent();
      return;
    }
    set({
      presentation: {
        ...held.target,
        startIndex: held.index,
        session: nextSession(),
      },
      presentationMode: held.mode,
      presentationIndex: held.index,
      presentedDeck: held.deck,
      presentedMedia: null,
      heldLivePresentation: null,
    });
  },

  setPresentationMode: (mode) => set({ presentationMode: mode }),

  setPresentationIndex: (index) => set({ presentationIndex: index }),

  updatePresentation: (kind, doc) => {
    const { presentation } = get();
    if (presentation?.kind !== kind || presentation.id !== doc.id) return false;
    set({ presentedDeck: { kind, id: doc.id, doc } });
    return true;
  },

  updateMediaPresentation: (item) => {
    const { presentation } = get();
    if (presentation?.kind !== item.kind || presentation.id !== item.id)
      return false;
    set({ presentedDeck: { kind: item.kind, id: item.id, item } });
    return true;
  },

  publishPresentedMedia: (state) => set({ presentedMedia: state }),

  stopPresent: () => {
    presentLiveWindow.endLive();
    set({
      presentation: null,
      presentationMode: "stage",
      presentationIndex: 0,
      presentedDeck: null,
      presentedMedia: null,
      heldLivePresentation: null,
    });
  },
});
