import { useEffect, useState } from "react";
import {
  EMPTY_STREAMS,
  readOpenerStreams,
  type SourceStreams,
} from "../lib/outputStreams";

const POLL_MS = 400;

export const useOpenerStreams = (): SourceStreams => {
  const [streams, setStreams] = useState<SourceStreams>(EMPTY_STREAMS);

  useEffect(() => {
    let seenVersion = -1;
    const pull = () => {
      const read = readOpenerStreams();
      if (!read || read.version === seenVersion) return;
      seenVersion = read.version;
      setStreams(read.streams);
    };
    pull();
    const timer = window.setInterval(pull, POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return streams;
};
