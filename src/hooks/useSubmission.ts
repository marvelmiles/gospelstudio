import { useCallback, useRef, useState } from "react";

export interface Submission {
  busy: boolean;
  problem: string | null;
  submit: (action: () => Promise<void>) => Promise<boolean>;
  clearProblem: () => void;
}

const UNEXPECTED_PROBLEM = "Something went wrong. Please try again.";

export const problemMessageOf = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : UNEXPECTED_PROBLEM;

export const useSubmission = (): Submission => {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
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
      setProblem(problemMessageOf(error));
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);

  const clearProblem = useCallback(() => setProblem(null), []);

  return { busy, problem, submit, clearProblem };
};
