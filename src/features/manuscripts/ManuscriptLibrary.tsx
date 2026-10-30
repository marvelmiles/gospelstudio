import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import type { Manuscript } from "../../types";
import { COLLECTIONS } from "../../data/collections";
import { useStore } from "../../store/useStore";
import { useBgMap } from "../../hooks/useBgMap";
import { pinnedCount, sortPinnedFirst } from "../../lib/pinning";
import { sortLibrary } from "../../lib/librarySort";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { PillTabs } from "@/components/shared/PillTabs";
import { buildSearchIndex, matchesSearch } from "../../lib/search";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadMoreFooter } from "@/components/shared/LoadMoreFooter";
import { QuickShareModal } from "../share/QuickShareModal";
import { useQuickShareTarget } from "../share/lib/useQuickShareTarget";
import { cardGridClassName } from "@/components/shared/InteractiveCard";
import { LibrarySortSelect } from "@/components/shared/LibrarySortSelect";
import { LayoutToggle } from "@/components/shared/LayoutToggle";
import { listClassName } from "@/components/shared/LibraryListRow";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useLibraryLayout } from "../../hooks/useLibraryLayout";
import { useIncrementalList } from "../../hooks/useIncrementalList";
import routes from "../../routes";
import { useLibrarySort } from "@/hooks/useLibrarySort";
import {
  ManuscriptCard,
  ManuscriptRow,
  type ManuscriptItemActions,
} from "./ManuscriptLibraryItem";

const searchTextCache = new WeakMap<Manuscript, string>();

const searchTextOf = (manuscript: Manuscript): string => {
  const cached = searchTextCache.get(manuscript);
  if (cached !== undefined) return cached;
  const text = buildSearchIndex([
    manuscript.title,
    manuscript.author,
    manuscript.collection,
    manuscript.music?.tune,
    manuscript.music?.composer,
    manuscript.body,
  ]);
  searchTextCache.set(manuscript, text);
  return text;
};

export const ManuscriptLibrary = () => {
  usePageMeta("manuscripts");
  const navigate = useNavigate();
  const manuscripts = useStore((s) => s.manuscripts);
  const themes = useStore((s) => s.themes);
  const deleteManuscript = useStore((s) => s.deleteManuscript);
  const startPresent = useStore((s) => s.startPresent);
  const pushToast = useStore((s) => s.pushToast);
  const bgMap = useBgMap();

  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("All");
  const [sort, setSort] = useLibrarySort("manuscripts");
  const [deleting, setDeleting] = useState<Manuscript | null>(null);
  const quickShare = useQuickShareTarget();
  const openQuickShare = quickShare.open;
  const { layout, setLayout } = useLibraryLayout("manuscripts");

  const onNew = () => navigate(routes.newManuscript());

  const term = query.trim();
  const searching = Boolean(term);

  const list = useMemo(() => {
    let base = manuscripts.filter((m) => !m.deleted);
    if (collection !== "All")
      base = base.filter((m) => m.collection === collection);
    if (term) base = base.filter((m) => matchesSearch(searchTextOf(m), term));
    const ordered = sortLibrary(base, sort, (m) => m.title);
    return term ? ordered : sortPinnedFirst(ordered);
  }, [manuscripts, term, collection, sort]);

  const shown = useIncrementalList(list, `${collection}|${sort}|${term}`);
  const usedPins = useMemo(() => pinnedCount(manuscripts), [manuscripts]);

  const actions = useMemo<ManuscriptItemActions>(
    () => ({
      open: (manuscript) => navigate(routes.manuscript(manuscript.id)),
      present: (manuscript, live) =>
        startPresent("manuscript", manuscript.id, 0, { live }),
      share: (manuscript) =>
        openQuickShare(
          [{ collection: "manuscripts", id: manuscript.id }],
          manuscript.title,
        ),
      remove: setDeleting,
    }),
    [navigate, startPresent, openQuickShare],
  );

  const confirmDelete = () => {
    if (deleting) {
      deleteManuscript(deleting.id);
      pushToast(`Deleted "${deleting.title}".`);
    }
    setDeleting(null);
  };

  const ManuscriptItem = layout === "grid" ? ManuscriptCard : ManuscriptRow;

  return (
    <div className={pageClassName}>
      <PageHeader
        title="Manuscripts"
        subtitle="Turn lyrics, hymns and sermons into slides."
        actions={
          <Button onClick={onNew}>
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
              <Button onClick={onNew}>
                <Plus size={15} />
                New Manuscript
              </Button>
            }
          />
        ))}

      <div className={layout === "grid" ? cardGridClassName : listClassName}>
        {shown.visibleItems.map((manuscript) => (
          <ManuscriptItem
            key={manuscript.id}
            manuscript={manuscript}
            themes={themes}
            bgMap={bgMap}
            usedPins={usedPins}
            actions={actions}
          />
        ))}
      </div>
      <LoadMoreFooter list={shown} noun="manuscripts" />

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
