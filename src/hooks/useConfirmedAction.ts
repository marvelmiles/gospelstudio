import { useCallback, useState } from "react";

export interface ConfirmedAction {
  prompting: boolean;
  request: () => void;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmedAction = (run: () => void): ConfirmedAction => {
  const [prompting, setPrompting] = useState(false);

  const confirm = useCallback(() => {
    setPrompting(false);
    run();
  }, [run]);

  return {
    prompting,
    request: useCallback(() => setPrompting(true), []),
    confirm,
    cancel: useCallback(() => setPrompting(false), []),
  };
};
