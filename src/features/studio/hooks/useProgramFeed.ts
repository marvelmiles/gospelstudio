import { useEffect, useState } from "react";
import type { ProgramSnapshot } from "../types/production";
import {
  OUTPUT_HEARTBEAT_MS,
  openStudioChannel,
  postStudioMessage,
} from "../lib/outputChannel";
import { applyProgramAssets } from "../lib/programAssets";

export interface ProgramFeed {
  program: ProgramSnapshot | null;
  isTesting: boolean;
  hasOperator: boolean;
}

export const useProgramFeed = (): ProgramFeed => {
  const [program, setProgram] = useState<ProgramSnapshot | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [hasOperator, setHasOperator] = useState(false);

  useEffect(() => {
    const channel = openStudioChannel((message) => {
      if (message.type === "program") {
        applyProgramAssets(message.assets);
        setProgram(message.program);
        setHasOperator(true);
        return;
      }
      if (message.type === "test") setIsTesting(message.active);
    });
    postStudioMessage(channel, { type: "hello" });
    const heartbeat = window.setInterval(
      () => postStudioMessage(channel, { type: "alive" }),
      OUTPUT_HEARTBEAT_MS,
    );
    const sayGoodbye = () => postStudioMessage(channel, { type: "bye" });
    window.addEventListener("pagehide", sayGoodbye);
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pagehide", sayGoodbye);
      sayGoodbye();
      channel?.close();
    };
  }, []);

  return { program, isTesting, hasOperator };
};
