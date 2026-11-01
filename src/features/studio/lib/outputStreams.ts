export type SourceStreams = Readonly<Record<string, MediaStream | null>>;

interface StudioStreamBridge {
  version: number;
  getStreams: () => SourceStreams;
}

declare global {
  interface Window {
    __gsStudioStreams?: StudioStreamBridge;
  }
}

export const EMPTY_STREAMS: SourceStreams = {};

let published: SourceStreams = EMPTY_STREAMS;
let version = 0;

/* Camera streams cannot travel over BroadcastChannel, so the projector window reads them from this window through window.opener. */
export const publishStreams = (streams: SourceStreams): void => {
  published = streams;
  version += 1;
  window.__gsStudioStreams = { version, getStreams: () => published };
};

export interface OpenerStreams {
  version: number;
  streams: SourceStreams;
}

export const readOpenerStreams = (): OpenerStreams | null => {
  try {
    const bridge = (window.opener as Window | null)?.__gsStudioStreams;
    if (!bridge) return null;
    return { version: bridge.version, streams: bridge.getStreams() };
  } catch {
    return null;
  }
};
