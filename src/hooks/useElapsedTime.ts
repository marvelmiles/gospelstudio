import { useEffect, useState } from "react";

const TICK_MS = 500;

export const useElapsedTime = (
  runningSince: number | null,
  carriedMs = 0,
): number => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (runningSince === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [runningSince]);

  return (
    carriedMs + (runningSince === null ? 0 : Math.max(0, now - runningSince))
  );
};
