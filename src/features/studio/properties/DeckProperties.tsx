import { useState } from "react";
import { BookOpen, FileText, RotateCcw } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { PassagePicker } from "../../bible/PassagePicker";
import { Button } from "@/components/ui/button";
import type { BibleLayer, DeckLayer, ManuscriptLayer } from "../types/layer";
import { libraryDeckDoc, ownDeckDoc, passagePatch } from "../lib/deckContent";
import { useDeckLook } from "../hooks/useContentLook";
import { updateLayer } from "../store/layerActions";
import { LibraryPicker } from "../library/LibraryPicker";
import { BackgroundFields } from "./BackgroundFields";
import { ContentPickerRow } from "./ContentPickerRow";
import { PropertySection } from "./fields";
import { ItemEditorActions } from "./ItemEditorActions";
import { useLayerEditor } from "./useLayerEditor";

interface DeckCopy {
  title: string;
  noun: string;
  chooseLabel: string;
  emptyLabel: string;
}

const DECK_COPY: Record<DeckLayer["type"], DeckCopy> = {
  manuscript: {
    title: "Manuscript",
    noun: "manuscript",
    chooseLabel: "Choose manuscript",
    emptyLabel: "No manuscript chosen",
  },
  bible: {
    title: "Passage",
    noun: "passage",
    chooseLabel: "Find a passage",
    emptyLabel: "No passage chosen",
  },
};

const restoreLibraryVersion = (layer: DeckLayer): void =>
  layer.type === "manuscript"
    ? updateLayer<ManuscriptLayer>(layer.id, { manuscript: null })
    : updateLayer<BibleLayer>(layer.id, { passage: null });

export const DeckProperties = ({ layer }: { layer: DeckLayer }) => {
  const edit = useLayerEditor<DeckLayer>(layer);
  const { doc } = useDeckLook(layer);
  const hasLibraryDoc = useStore((state) =>
    Boolean(libraryDeckDoc(layer, state)),
  );
  const [isPicking, setIsPicking] = useState(false);
  const copy = DECK_COPY[layer.type];
  const hasOwnCopy = Boolean(ownDeckDoc(layer));

  return (
    <>
      <PropertySection
        title={copy.title}
        info={`It shows exactly as it looks in its editor. Open editor changes its words, look, animations and auto-play for this production only, and the ${copy.noun} in your library stays as it was.`}
      >
        <ContentPickerRow
          icon={layer.type === "bible" ? BookOpen : FileText}
          name={doc?.title ?? null}
          emptyLabel={copy.emptyLabel}
          actionLabel={doc ? "Change" : copy.chooseLabel}
          onPick={() => setIsPicking(true)}
        />
        <ItemEditorActions layer={layer} />
        {hasOwnCopy && hasLibraryDoc && (
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            title={`Drop this production's changes and use the ${copy.noun} from your library`}
            onClick={() => restoreLibraryVersion(layer)}
          >
            <RotateCcw />
            Use the library version
          </Button>
        )}
      </PropertySection>

      <BackgroundFields
        fill={layer.fill}
        sourceLabel={`As in the ${copy.noun}`}
        onChange={(fill, field) => edit({ fill }, field)}
      />

      {layer.type === "manuscript" ? (
        <ManuscriptChooser
          layer={layer}
          open={isPicking}
          onClose={() => setIsPicking(false)}
        />
      ) : (
        <PassageChooser
          layer={layer}
          open={isPicking}
          onClose={() => setIsPicking(false)}
        />
      )}
    </>
  );
};

interface ChooserProps<T extends DeckLayer> {
  layer: T;
  open: boolean;
  onClose: () => void;
}

const ManuscriptChooser = ({
  layer,
  open,
  onClose,
}: ChooserProps<ManuscriptLayer>) => (
  <LibraryPicker
    kind={open ? "manuscript" : null}
    onPick={(choice) => {
      updateLayer<ManuscriptLayer>(layer.id, {
        manuscriptId: choice.id,
        manuscript: null,
        slideIndex: 0,
        name: choice.name,
      });
      onClose();
    }}
    onClose={onClose}
  />
);

const PassageChooser = ({ layer, open, onClose }: ChooserProps<BibleLayer>) => (
  <PassagePicker
    open={open}
    destination="this scene"
    onClose={onClose}
    onPick={(pick) => {
      updateLayer<BibleLayer>(layer.id, passagePatch(pick, layer.passage));
      onClose();
    }}
  />
);
