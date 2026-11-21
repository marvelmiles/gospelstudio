import { LiveEncoderPipeline } from "./liveEncoderPipeline";
import type { EncoderCommand, EncoderEvent } from "./liveEncoderProtocol";

interface EncoderWorkerScope {
  onmessage: ((event: MessageEvent<EncoderCommand>) => void) | null;
  postMessage: (message: EncoderEvent) => void;
}

const workerScope = self as unknown as EncoderWorkerScope;

let pipeline: LiveEncoderPipeline | null = null;

workerScope.onmessage = ({ data }) => {
  pipeline?.stop();
  pipeline =
    data.type === "start"
      ? new LiveEncoderPipeline(data, (event) => workerScope.postMessage(event))
      : null;
};
