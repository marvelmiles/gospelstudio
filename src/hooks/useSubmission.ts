import { useCallback, useRef, useState } from "react";
import { userProblemOf, type UserProblem } from "../lib/userProblem";

export interface Submission {
  busy: boolean;
  problem: UserProblem | null;
  submit: (action: () => Promise<void>) => Promise<boolean>;
  clearProblem: () => void;
}

export const useSubmission = (): Submission => {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<UserProblem | null>(null);
  const inFlight = useRef(false);

  const submit = useCallback(async (action: () => Promise<void>) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    setProblem(null);
    try {
      await action();
      return true;
    } catch (error) {
      setProblem(userProblemOf(error));
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);

  const clearProblem = useCallback(() => setProblem(null), []);

  return { busy, problem, submit, clearProblem };
};
