import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, PenLine, Plus, Share2, Trash2 } from "lucide-react";
import type { Manuscript, Theme } from "../../types";
import { COLLECTIONS } from "../../data/collections";
import { useStore } from "../../store/useStore";
import { useBgMap } from "../../hooks/useBgMap";
import type { BgMap } from "../../hooks/useBgMap";
import { sortPinnedFirst } from "../../lib/pinning";
import {
  DEFAULT_LIBRARY_SORT,
  sortLibrary,
  type LibrarySortOption,
} from "../../lib/librarySort";
import { resolveLineStyle, resolveStyle } from "../../lib/resolve";
import { useBackgroundView } from "../../hooks/useBackgroundView";
import { SlideCanvas } from "../../components/SlideCanvas";
import { BgSwatch } from "../../components/controls/BgSwatch";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageHeader, pageClassName } from "../../components/ui/PageHeader";
import { PillTabs } from "../../components/ui/PillTabs";
import { buildSearchIndex, matchesSearch } from "../../lib/search";
import { formatCountLabel } from "../../lib/formatNumber";
import { formatDate } from "../../lib/id";
import { LazyMount } from "../../components/ui/LazyMount";
import { SearchInput } from "../../components/ui/SearchInput";
import { EmptyState } from "../../components/ui/EmptyState";
import { MoreMenu } from "../../components/ui/MoreMenu";
import { QuickShareModal } from "../share/QuickShareModal";
import { useQuickShareTarget } from "../share/lib/useQuickShareTarget";
import type { MoreMenuItem } from "../../components/ui/MoreMenu";
import {
  KeepOnResetBadge,
  useKeepOnResetAction,
} from "../../components/ui/KeepOnResetToggle";
import { PinButton } from "../../components/ui/PinControl";
import {
  CardActions,
  CardTitle,
  cardBodyClassName,
  cardClassName,
  cardGridClassName,
  cardOpenProps,
  cardSubClassName,
  cardThumbBadgeClassName,
} from "../../components/ui/InteractiveCard";
import { LibrarySortSelect } from "../../components/ui/LibrarySortSelect";
import { LayoutToggle } from "../../components/ui/LayoutToggle";
import {
  LibraryListRow,
  listClassName,
} from "../../components/ui/LibraryListRow";
import { PresentMenu } from "../../components/ui/PresentMenu";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useLibraryLayout } from "../../hooks/useLibraryLayout";
import routes from "../../routes";

export const ManuscriptLibrary = () => {
  useDocumentTitle("Manuscripts");
  const navigate = useNavigate();
  const manuscripts = useStore((s) => s.manuscripts);
  const themes = useStore((s) => s.themes);
  const deleteManuscript = useStore((s) => s.deleteManuscript);
  const startPresent = useStore((s) => s.startPresent);
  const pushToast = useStore((s) => s.pushToast);
  const bgMap = useBgMap();

  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("All");
  const [sort, setSort] = useState<LibrarySortOption>(DEFAULT_LIBRARY_SORT);
  const [deleting, setDeleting] = useState<Manuscript | null>(null);
  const quickShare = useQuickShareTarget();
  const { layout, setLayout } = useLibraryLayout("manuscripts");

  const onNew = () => navigate(routes.newManuscript());

  const searching = Boolean(query.trim());

  /* Built once, not on every keystroke: the hymnal alone has hundreds of songs to search. */
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    for (const manuscript of manuscripts)
      index.set(
        manuscript.id,
        buildSearchIndex([
          manuscript.title,
          manuscript.author,
          manuscript.collection,
          manuscript.music?.tune,
          manuscript.music?.composer,
          manuscript.body,
        ]),
      );
    return index;
  }, [manuscripts]);

  const list = useMemo(() => {
    let base = manuscripts.filter((m) => !m.deleted);
    if (collection !== "All")
      base = base.filter((m) => m.collection === collection);
    const term = query.trim();
    if (term)
      base = base.filter((m) =>
        matchesSearch(searchIndex.get(m.id) ?? "", term),
      );
    const ordered = sortLibrary(base, sort, (m) => m.title);
    return term ? ordered : sortPinnedFirst(ordered);
  }, [manuscripts, searchIndex, query, collection, sort]);

  const confirmDelete = () => {
    if (deleting) {
      deleteManuscript(deleting.id);
      pushToast(`Deleted "${deleting.title}".`);
    }
    setDeleting(null);
  };

  return (
    <div className={pageClassName}>
      <PageHeader
        title="Manuscripts"
        subtitle="Turn lyrics, hymns and sermons into slides."
        actions={
          <Button variant="primary" onClick={onNew}>
            <Plus size={16} />
            New Manuscript
          </Button>
        }
      />

      <div className="mb-4.5 grid gap-3">
        <PillTabs
          tabs={["All", ...COLLECTIONS].map((c) => ({ id: c, label: c }))}
          value={collection}
          onChange={setCollection}
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by title, author, text…"
          />
          <LibrarySortSelect
            value={sort}
            onChange={setSort}
            nameLabel="Title"
          />
          <LayoutToggle
            value={layout}
            onChange={setLayout}
            noun="manuscripts"
          />
        </div>
      </div>

      {list.length === 0 &&
        (searching || collection !== "All" ? (
          <EmptyState
            icon={FileText}
            title="No manuscripts match"
            message="Try a different search or switch collection."
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="No manuscripts yet"
            message="Its text turns into styled slides, ready to present."
            action={
              <Button variant="primary" onClick={onNew}>
                <Plus size={15} />
                New Manuscript
              </Button>
            }
          />
        ))}

      <div className={layout === "grid" ? cardGridClassName : listClassName}>
        {list.map((manuscript) => {
          const props = {
            manuscript,
            library: manuscripts,
            themes,
            bgMap,
            onOpen: () => navigate(routes.manuscript(manuscript.id)),
            onPresent: (live: boolean) =>
              startPresent("manuscript", manuscript.id, 0, { live }),
            onQuickShare: () =>
              quickShare.open(
                [{ collection: "manuscripts", id: manuscript.id }],
                manuscript.title,
              ),
            onDelete: () => setDeleting(manuscript),
          };
          return layout === "grid" ? (
            <ManuscriptCard key={manuscript.id} {...props} />
          ) : (
            <ManuscriptRow key={manuscript.id} {...props} />
          );
        })}
      </div>

      {quickShare.target && (
        <QuickShareModal
          records={quickShare.target.records}
          title={quickShare.target.title}
          onClose={quickShare.close}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete manuscript?"
        message={`"${deleting?.title}" and its slides will be permanently removed. This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

const manuscriptMenuItems = (
  onOpen: () => void,
  onQuickShare: () => void,
  keepAction: MoreMenuItem | null,
): MoreMenuItem[] => [
  { label: "Open in editor", icon: PenLine, onClick: onOpen },
  {
    label: "Quick share",
    icon: Share2,
    title: "Send this to another device on your WiFi",
    onClick: onQuickShare,
  },
  ...(keepAction ? [keepAction] : []),
];

interface ManuscriptCardProps {
  manuscript: Manuscript;
  library: Manuscript[];
  themes: Theme[];
  bgMap: BgMap;
  onOpen: () => void;
  onPresent: (live: boolean) => void;
  onQuickShare: () => void;
  onDelete: () => void;
}

const useManuscriptCover = (
  manuscript: Manuscript,
  themes: Theme[],
  bgMap: BgMap,
): ReactNode => {
  const first = manuscript.slides?.[0];
  const theme =
    themes.find((t) => t.id === manuscript.defaultThemeId) || themes[0];
  const { background, image, video } = useBackgroundView(
    first,
    manuscript,
    theme,
    bgMap,
  );

  const swatch = (
    <BgSwatch bg={background} settings={image} className="aspect-video" />
  );

  if (!first) return swatch;

  return (
    <LazyMount placeholder={swatch}>
      <SlideCanvas
        slide={first}
        bg={background}
        bgImage={image}
        bgVideo={video}
        radius={0}
        style={resolveStyle(first, manuscript, theme)}
        lineStyles={first.lines.map((_, i) =>
          resolveLineStyle(first, i, manuscript, theme),
        )}
      />
    </LazyMount>
  );
};

const manuscriptDetails = (manuscript: Manuscript): string[] => [
  manuscript.author || "Unknown author",
  ...(manuscript.collection ? [manuscript.collection] : []),
  formatCountLabel(manuscript.slides?.length || 0, "slide"),
  `Added ${formatDate(manuscript.createdAt)}`,
  `Last modified ${formatDate(manuscript.updatedAt)}`,
];

const deleteTitle = (manuscript: Manuscript): string =>
  manuscript.builtIn
    ? "Default manuscripts can't be deleted"
    : "Delete manuscript";

const ManuscriptRow = ({
  manuscript,
  library,
  themes,
  bgMap,
  onOpen,
  onPresent,
  onQuickShare,
  onDelete,
}: ManuscriptCardProps) => {
  const keepAction = useKeepOnResetAction("manuscript", manuscript);
  const cover = useManuscriptCover(manuscript, themes, bgMap);

  return (
    <LibraryListRow
      cover={cover}
      title={manuscript.title}
      badges={<KeepOnResetBadge item={manuscript} />}
      details={manuscriptDetails(manuscript)}
      onOpen={onOpen}
      actions={
        <>
          <PresentMenu onPresent={({ live }) => onPresent(live)} />
          <PinButton kind="manuscript" item={manuscript} library={library} />
          <IconButton
            filled
            danger
            size="sm"
            icon={Trash2}
            disabled={manuscript.builtIn}
            title={deleteTitle(manuscript)}
            onClick={onDelete}
          />
          <MoreMenu
            filled
            size="sm"
            items={manuscriptMenuItems(onOpen, onQuickShare, keepAction)}
          />
        </>
      }
    />
  );
};

const ManuscriptCard = ({
  manuscript,
  library,
  themes,
  bgMap,
  onOpen,
  onPresent,
  onQuickShare,
  onDelete,
}: ManuscriptCardProps) => {
  const keepAction = useKeepOnResetAction("manuscript", manuscript);
  const cover = useManuscriptCover(manuscript, themes, bgMap);

  const menuItems = manuscriptMenuItems(onOpen, onQuickShare, keepAction);

  return (
    <div className={cardClassName} {...cardOpenProps(manuscript.title, onOpen)}>
      <div className="relative">
        {cover}
        <div className={cardThumbBadgeClassName}>
          {formatCountLabel(manuscript.slides?.length || 0, "slide")}
        </div>
      </div>
      <div className={cardBodyClassName}>
        <CardTitle title={manuscript.title}>
          <KeepOnResetBadge item={manuscript} />
        </CardTitle>
        <div className={cardSubClassName}>
          {manuscript.author || "Unknown"}
          {manuscript.collection ? ` · ${manuscript.collection}` : ""}
        </div>
        <CardActions>
          <PresentMenu fill onPresent={({ live }) => onPresent(live)} />
          <PinButton kind="manuscript" item={manuscript} library={library} />
          <IconButton
            filled
            danger
            size="sm"
            icon={Trash2}
            disabled={manuscript.builtIn}
            title={deleteTitle(manuscript)}
            onClick={onDelete}
          />
          <MoreMenu filled size="sm" items={menuItems} />
        </CardActions>
      </div>
    </div>
  );
};
