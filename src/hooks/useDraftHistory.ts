import { useCallback, useReducer, useRef } from "react";

const HISTORY_LIMIT = 200;
const COALESCE_MS = 600;

export interface DraftEditOptions {
  coalesceKey?: string;
}

export interface DraftHistory<T> {
  draft: T;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  apply: (next: T, options?: DraftEditOptions) => void;
  patch: (changes: Partial<T>, options?: DraftEditOptions) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  commit: (next: T) => void;
  reset: (next: T) => void;
}

interface HistoryState<T> {
  draft: T;
  saved: T;
  past: T[];
  future: T[];
}

type HistoryAction<T> =
  | { type: "apply"; next: (draft: T) => T; merge: boolean }
  | { type: "step"; back: boolean }
  | { type: "markSaved" }
  | { type: "commit"; next: T }
  | { type: "reset"; next: T };

const remember = <T>(entries: T[], entry: T): T[] =>
  [...entries, entry].slice(-HISTORY_LIMIT);

const historyReducer = <T>(
  state: HistoryState<T>,
  action: HistoryAction<T>,
): HistoryState<T> => {
  switch (action.type) {
    case "apply": {
      const draft = action.next(state.draft);
      if (action.merge) return { ...state, draft };
      return {
        ...state,
        draft,
        past: remember(state.past, state.draft),
        future: [],
      };
    }
    case "step": {
      const from = action.back ? state.past : state.future;
      const entry = from[from.length - 1];
      if (entry === undefined) return state;
      const remaining = from.slice(0, -1);
      return action.back
        ? {
            ...state,
            draft: entry,
            past: remaining,
            future: remember(state.future, state.draft),
          }
        : {
            ...state,
            draft: entry,
            future: remaining,
            past: remember(state.past, state.draft),
          };
    }
    case "markSaved":
      return { ...state, saved: state.draft };
    case "commit":
      return { ...state, draft: action.next, saved: action.next };
    case "reset":
      return { draft: action.next, saved: action.next, past: [], future: [] };
  }
};

export const useDraftHistory = <T>(initial: T): DraftHistory<T> => {
  const [state, dispatch] = useReducer(
    historyReducer<T>,
    initial,
    (draft): HistoryState<T> => ({ draft, saved: draft, past: [], future: [] }),
  );
  const coalesce = useRef<{ key: string; at: number } | null>(null);

  const edit = useCallback(
    (next: (draft: T) => T, options?: DraftEditOptions) => {
      const at = Date.now();
      const key = options?.coalesceKey;
      const merge = Boolean(
        key &&
        coalesce.current?.key === key &&
        at - coalesce.current.at < COALESCE_MS,
      );
      coalesce.current = key ? { key, at } : null;
      dispatch({ type: "apply", next, merge });
    },
    [],
  );

  const apply = useCallback(
    (next: T, options?: DraftEditOptions) => edit(() => next, options),
    [edit],
  );

  const patch = useCallback(
    (changes: Partial<T>, options?: DraftEditOptions) =>
      edit((draft) => ({ ...draft, ...changes }), options),
    [edit],
  );

  const step = useCallback((back: boolean) => {
    coalesce.current = null;
    dispatch({ type: "step", back });
  }, []);

  const undo = useCallback(() => step(true), [step]);
  const redo = useCallback(() => step(false), [step]);
  const markSaved = useCallback(() => dispatch({ type: "markSaved" }), []);
  const commit = useCallback(
    (next: T) => dispatch({ type: "commit", next }),
    [],
  );
  const reset = useCallback((next: T) => {
    coalesce.current = null;
    dispatch({ type: "reset", next });
  }, []);

  return {
    draft: state.draft,
    dirty: state.draft !== state.saved,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    apply,
    patch,
    undo,
    redo,
    markSaved,
    commit,
    reset,
  };
};
