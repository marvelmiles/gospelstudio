import { useEffect, useEffectEvent, useState } from "react";
import type {
  ReportBySection,
  ReportSection,
} from "../../../lib/analytics/reportTypes";
import {
  fetchReport,
  reportUrl,
  ReportRequestError,
  type ReportSelection,
} from "../lib/reportApi";

const UNAUTHORIZED_STATUS = 401;

interface SettledReport<T> {
  key: string;
  data: T | null;
  error: ReportRequestError | null;
}

export interface ReportState<T> {
  data: T | null;
  error: ReportRequestError | null;
  isLoading: boolean;
  retry: () => void;
}

const unexpectedError = (): ReportRequestError =>
  new ReportRequestError(
    "unexpected",
    "Something went wrong while loading this report.",
    0,
  );

export const useAnalyticsReport = <S extends ReportSection>(
  section: S,
  selection: ReportSelection,
  adminKey: string,
  reloadToken: number,
  onUnauthorized: () => void,
): ReportState<ReportBySection[S]> => {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<SettledReport<ReportBySection[S]>>({
    key: "",
    data: null,
    error: null,
  });
  const { period, from, to } = selection;
  const requestKey = `${reportUrl(section, selection)}#${reloadToken}:${attempt}`;
  const rejectKey = useEffectEvent(onUnauthorized);

  useEffect(() => {
    const controller = new AbortController();
    fetchReport(section, { period, from, to }, adminKey, controller.signal)
      .then((data) => setSettled({ key: requestKey, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const reportError =
          error instanceof ReportRequestError ? error : unexpectedError();
        if (reportError.status === UNAUTHORIZED_STATUS) {
          rejectKey();
          return;
        }
        setSettled({ key: requestKey, data: null, error: reportError });
      });
    return () => controller.abort();
  }, [requestKey, section, period, from, to, adminKey]);

  const isSettled = settled.key === requestKey;
  return {
    data: settled.data,
    error: isSettled ? settled.error : null,
    isLoading: !isSettled,
    retry: () => setAttempt((count) => count + 1),
  };
};
