import type { Manuscript, Slide } from "../../types";
import { deepEqual } from "../equality";

export interface DefaultManuscriptPlan {
  manuscripts: Manuscript[];
  toInstall: Manuscript[];
  staleIds: string[];
}

const isUntouched = (manuscript: Manuscript): boolean =>
  manuscript.updatedAt === manuscript.createdAt;

const refresh = (stored: Manuscript, fresh: Manuscript): Manuscript => ({
  ...fresh,
  deleted: stored.deleted,
  pinned: stored.pinned,
  keepOnReset: stored.keepOnReset,
  mark: stored.mark,
});

export const planDefaultManuscripts = (
  stored: Manuscript[],
  defaults: Manuscript[],
): DefaultManuscriptPlan => {
  const defaultIds = new Set(defaults.map((manuscript) => manuscript.id));
  const storedById = new Map(
    stored.map((manuscript) => [manuscript.id, manuscript]),
  );

  const owned = stored.filter((manuscript) => !manuscript.builtIn);
  const staleIds = stored
    .filter(
      (manuscript) => manuscript.builtIn && !defaultIds.has(manuscript.id),
    )
    .map((manuscript) => manuscript.id);

  const toInstall: Manuscript[] = [];
  const builtIns = defaults.map((manuscript) => {
    const existing = storedById.get(manuscript.id);
    if (existing && !isUntouched(existing)) return existing;

    const next = existing ? refresh(existing, manuscript) : manuscript;
    toInstall.push(next);
    return next;
  });

  return { manuscripts: [...owned, ...builtIns], toInstall, staleIds };
};

const slideContent = ({ id: _id, flowId: _flowId, ...slide }: Slide) => slide;

const content = ({
  createdAt: _createdAt,
  updatedAt: _updatedAt,
  ...manuscript
}: Manuscript) => ({
  ...manuscript,
  slides: (manuscript.slides ?? []).map(slideContent),
});

export const matchesDefault = (
  draft: Manuscript,
  shipped: Manuscript,
): boolean => deepEqual(content(draft), content({ ...draft, ...shipped }));
