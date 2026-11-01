import { useState } from "react";
import {
  BookOpen,
  FileText,
  Film,
  IdCard,
  Image as ImageIcon,
  Megaphone,
  Newspaper,
  QrCode,
  Shapes,
  Type,
  Wallpaper,
  Webcam,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "../../../store/useStore";
import { PassagePicker, type PassagePick } from "../../bible/PassagePicker";
import type { Layer, ShapeKind } from "../types/layer";
import { createLayer, placement } from "../lib/layerDefaults";
import {
  FULL_FRAME,
  centeredFrame,
  percentFrame,
} from "../lib/canvasCoordinates";
import { passagePatch } from "../lib/deckContent";
import { SHAPES } from "../lib/shapeCatalog";
import { addLayer } from "../store/layerActions";
import { showSidebarView } from "../store/editorStore";
import { usePreviewScene } from "../store/productionStore";
import { CameraPicker } from "../camera/CameraPicker";
import { ShapePicker } from "../shapes/ShapePicker";
import { SidebarPane } from "../sidebar/SidebarPane";
import {
  LibraryPicker,
  type LibraryChoice,
  type LibraryKind,
} from "./LibraryPicker";

type PendingPick =
  | { kind: "camera" }
  | { kind: "bible" }
  | { kind: "shape" }
  | { kind: "library"; library: LibraryKind };

interface ElementOption {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  run: () => void;
}

interface ElementGroup {
  title: string;
  options: ElementOption[];
}

const layerFromLibrary = (
  library: LibraryKind,
  choice: LibraryChoice,
): Layer => {
  switch (library) {
    case "manuscript":
      return createLayer("manuscript", {
        name: choice.name,
        manuscriptId: choice.id,
      });
    case "image":
      return createLayer("image", { name: choice.name, mediaId: choice.id });
    case "video":
      return createLayer("video", { name: choice.name, mediaId: choice.id });
    case "background":
      return createLayer("background", {
        name: choice.name,
        backgroundId: choice.id,
      });
  }
};

const shapeLayer = (shape: ShapeKind): Layer => {
  const { label, size, radius } = SHAPES[shape];
  return createLayer("shape", {
    name: label,
    shape,
    radius,
    ...placement(centeredFrame(size)),
  });
};

const tickerLayer = (): Layer =>
  createLayer("announcement", {
    name: "Scrolling ticker",
    variant: "ticker",
    heading: "Notice",
    body: "Type your announcement here",
    radius: 0,
    animation: { entrance: "slide-up", durationMs: 450 },
    ...placement(percentFrame(0, 90, 100, 10)),
  });

export const ElementsPanel = () => {
  const scene = usePreviewScene();
  const pushToast = useStore((state) => state.pushToast);
  const [pending, setPending] = useState<PendingPick | null>(null);

  const add = (layer: Layer) => {
    setPending(null);
    addLayer(layer);
    pushToast(`Added ${layer.name} to ${scene?.name ?? "the scene"}.`);
  };

  const addCamera = (sourceId: string) => {
    const hasCamera = scene?.layers.some((layer) => layer.type === "camera");
    add(
      createLayer("camera", {
        sourceId,
        ...placement(hasCamera ? percentFrame(68, 63, 29, 31) : FULL_FRAME),
        radius: hasCamera ? 24 : 0,
      }),
    );
  };

  const addPassage = (pick: PassagePick) =>
    add({ ...createLayer("bible"), ...passagePatch(pick) });

  const pickFrom = (library: LibraryKind) => () =>
    setPending({ kind: "library", library });

  const groups: ElementGroup[] = [
    {
      title: "Popular",
      options: [
        {
          id: "camera",
          label: "Camera",
          hint: "A webcam, capture card or a phone on your WiFi",
          icon: Webcam,
          run: () => setPending({ kind: "camera" }),
        },
        {
          id: "bible",
          label: "Bible passage",
          hint: "Find a verse or a range",
          icon: BookOpen,
          run: () => setPending({ kind: "bible" }),
        },
        {
          id: "manuscript",
          label: "Manuscript",
          hint: "From your manuscripts, with their own look",
          icon: FileText,
          run: pickFrom("manuscript"),
        },
        {
          id: "text",
          label: "Text",
          hint: "Words you type, as normal text, a heading or a subtitle",
          icon: Type,
          run: () => add(createLayer("text")),
        },
        {
          id: "image",
          label: "Image",
          hint: "From your images, including a logo",
          icon: ImageIcon,
          run: pickFrom("image"),
        },
        {
          id: "video",
          label: "Video",
          hint: "From your video library",
          icon: Film,
          run: pickFrom("video"),
        },
      ],
    },
    {
      title: "More",
      options: [
        {
          id: "lower-third",
          label: "Speaker name",
          hint: "A name and title at the bottom",
          icon: IdCard,
          run: () => add(createLayer("lowerThird")),
        },
        {
          id: "announcement",
          label: "Announcement",
          hint: "A heading with details",
          icon: Megaphone,
          run: () => add(createLayer("announcement")),
        },
        {
          id: "ticker",
          label: "Scrolling ticker",
          hint: "News that moves along the bottom",
          icon: Newspaper,
          run: () => add(tickerLayer()),
        },
        {
          id: "qr",
          label: "QR code",
          hint: "Phones scan it to open a link",
          icon: QrCode,
          run: () => add(createLayer("qr")),
        },
        {
          id: "background",
          label: "Background",
          hint: "A colour, image or moving background",
          icon: Wallpaper,
          run: pickFrom("background"),
        },
        {
          id: "shapes",
          label: "Shapes",
          hint: "Rectangles, circles, stars, arrows and more",
          icon: Shapes,
          run: () => setPending({ kind: "shape" }),
        },
      ],
    },
  ];

  return (
    <SidebarPane
      title="Add to this scene"
      onBack={() => showSidebarView("items")}
    >
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <section key={group.title}>
            <h3 className="mt-0 mb-2 section-label">{group.title}</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-1.5">
              {group.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={option.run}
                  title={option.hint}
                  className="flex min-h-19 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-1.5 py-2.5 text-center transition-colors outline-none hover:border-primary/45 hover:bg-primary/6 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option.icon size={19} className="text-primary-soft" />
                  <span className="line-clamp-2 text-[12px] leading-tight font-semibold text-foreground">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <CameraPicker
        open={pending?.kind === "camera"}
        confirmLabel="Add this camera"
        onChoose={addCamera}
        onClose={() => setPending(null)}
      />
      <PassagePicker
        open={pending?.kind === "bible"}
        destination="the scene"
        onClose={() => setPending(null)}
        onPick={addPassage}
      />
      <ShapePicker
        open={pending?.kind === "shape"}
        onChoose={(shape) => add(shapeLayer(shape))}
        onClose={() => setPending(null)}
      />
      <LibraryPicker
        kind={pending?.kind === "library" ? pending.library : null}
        onPick={(choice) => {
          if (pending?.kind === "library")
            add(layerFromLibrary(pending.library, choice));
        }}
        onClose={() => setPending(null)}
      />
    </SidebarPane>
  );
};
