import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, PenLine, RotateCcw, Share2, Trash2 } from "lucide-react";
import type { ScripturePassage, Theme } from "../../types";
import { useStore } from "../../store/useStore";
import { useBgMap } from "../../hooks/useBgMap";
import type { BgMap } from "../../hooks/useBgMap";
import { sortPinnedFirst } from "../../lib/pinning";
import { sortLibrary } from "../../lib/librarySort";
import { resolveLineStyle, resolveStyle } from "../../lib/resolve";
import { useBackgroundView } from "../../hooks/useBackgroundView";
import { SlideCanvas } from "../../components/SlideCanvas";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { MoreMenu } from "@/components/shared/MoreMenu";
import { QuickShareModal } from "../share/QuickShareModal";
import { useQuickShareTarget } from "../share/lib/useQuickShareTarget";
import { PinButton } from "@/components/shared/PinControl";
import {
  CardActions,
  CardTitle,
  cardBodyClassName,
  cardClassName,
  cardGridClassName,
  cardSubClassName,
  cardThumbBadgeClassName,
} from "@/components/shared/InteractiveCard";
import { cardOpenProps } from "@/components/shared/cardOpenProps";
import { LibrarySortSelect } from "@/components/shared/LibrarySortSelect";
import { PresentMenu } from "@/components/shared/PresentMenu";
import routes from "../../routes";
import { formatCountLabel } from "../../lib/formatNumber";
import { useLibrarySort } from "@/hooks/useLibrarySort";

export const SavedPassages = ({ trashView }: { trashView: boolean }) => {
  const navigate = useNavigate();
  const scriptures = useStore((s) => s.scriptures);
  const themes = useStore((s) => s.themes);
  const startPresent = useStore((s) => s.startPresent);
  const trashScripture = useStore((s) => s.trashScripture);
  const restoreScripture = useStore((s) => s.restoreScripture);
  const deleteScripture = useStore((s) => s.deleteScripture);
  const bgMap = useBgMap();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useLibrarySort("scriptures");
  const quickShare = useQuickShareTarget();

  const saved = useMemo(
    () => scriptures.filter((passage) => !passage.quick),
    [scriptures],
  );

  const list = useMemo(() => {
    let base = saved.filter((s) => (trashView ? s.deleted : !s.deleted));
    const term = query.trim().toLowerCase();
    if (term) {
      base = base.filter((s) =>
        [s.title, s.version, s.range.bookName].some((f) =>
          f.toLowerCase().includes(term),
        ),
      );
    }
    const ordered = sortLibrary(base, sort, (s) => s.title);
    return term || trashView ? ordered : sortPinnedFirst(ordered);
  }, [saved, query, trashView, sort]);

  return (
    <>
      {!trashView && (
        <div className="mb-4.5 flex flex-wrap items-center gap-2.5">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search saved passages…"
          />
          <LibrarySortSelect
            value={sort}
            onChange={setSort}
            nameLabel="Title"
          />
        </div>
      )}

      {list.length === 0 ? (
        trashView ? (
          <EmptyState
            icon={Trash2}
            title="Trash is empty"
            message="Deleted passages wait here until removed for good."
          />
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No saved passages yet"
            message="Save verses from the reader to present them any time."
          />
        )
      ) : (
        <div className={cardGridClassName}>
          {list.map((passage) => (
            <PassageCard
              key={passage.id}
              passage={passage}
              library={saved}
              themes={themes}
              bgMap={bgMap}
              trashView={trashView}
              onOpen={() => navigate(routes.passage(passage.id))}
              onPresent={(live) =>
                startPresent("scripture", passage.id, 0, { live })
              }
              onQuickShare={() =>
                quickShare.open(
                  [{ collection: "scriptures", id: passage.id }],
                  passage.title,
                )
              }
              onTrash={() => trashScripture(passage.id)}
              onRestore={() => restoreScripture(passage.id)}
              onDelete={() => deleteScripture(passage.id)}
            />
          ))}
        </div>
      )}

      {quickShare.target && (
        <QuickShareModal
          records={quickShare.target.records}
          title={quickShare.target.title}
          onClose={quickShare.close}
        />
      )}
    </>
  );
};

interface PassageCardProps {
  passage: ScripturePassage;
  library: ScripturePassage[];
  themes: Theme[];
  bgMap: BgMap;
  trashView: boolean;
  onOpen: () => void;
  onPresent: (live: boolean) => void;
  onQuickShare: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

const PassageCard = ({
  passage,
  library,
  themes,
  bgMap,
  trashView,
  onOpen,
  onPresent,
  onQuickShare,
  onTrash,
  onRestore,
  onDelete,
}: PassageCardProps) => {
  const first = passage.slides?.[0];
  const theme =
    themes.find((t) => t.id === passage.defaultThemeId) || themes[0];
  const background = useBackgroundView(first, passage, theme, bgMap);

  return (
    <div
      className={cardClassName}
      {...cardOpenProps(passage.title, trashView ? undefined : onOpen)}
    >
      <div className="relative">
        {first && (
          <SlideCanvas
            slide={first}
            bg={background.background}
            bgImage={background.image}
            bgVideo={background.video}
            radius={0}
            style={resolveStyle(first, passage, theme)}
            lineStyles={first.lines.map((_, i) =>
              resolveLineStyle(first, i, passage, theme),
            )}
          />
        )}
        <div className={cardThumbBadgeClassName}>
          {formatCountLabel(passage.slides?.length || 0, "slide")}
        </div>
      </div>
      <div className={cardBodyClassName}>
        <CardTitle title={passage.title} />
        <div className={cardSubClassName}>
          {passage.version} · {formatCountLabel(passage.verses.length, "verse")}
        </div>
        <CardActions>
          {trashView ? (
            <>
              <Button size="sm" variant="secondary" onClick={onRestore}>
                <RotateCcw size={13} />
                Restore
              </Button>
              <Button size="sm" variant="destructive" onClick={onDelete}>
                <Trash2 size={13} />
                Delete
              </Button>
            </>
          ) : (
            <>
              <PresentMenu fill onPresent={({ live }) => onPresent(live)} />
              <PinButton kind="scripture" item={passage} library={library} />
              <IconButton
                filled
                danger
                size="sm"
                icon={Trash2}
                title="Move to trash"
                onClick={onTrash}
              />
              <MoreMenu
                filled
                size="sm"
                items={[
                  { label: "Open in editor", icon: PenLine, onClick: onOpen },
                  {
                    label: "Quick share",
                    icon: Share2,
                    title: "Send this to another device on your WiFi",
                    onClick: onQuickShare,
                  },
                ]}
              />
            </>
          )}
        </CardActions>
      </div>
    </div>
  );
};
