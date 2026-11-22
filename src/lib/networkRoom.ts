export const STUN_SERVERS = [
  "stun:stun.cloudflare.com:3478",
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:global.stun.twilio.com:3478",
];

const LOOKUP_TIMEOUT_MS = 8000;
const CACHE_MS = 2 * 60 * 1000;
const IPV6_NETWORK_GROUPS = 4;

const hashToRoom = (input: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return "net-" + (h >>> 0).toString(36);
};

export const publicAddressOf = (candidate: string): string | null => {
  const parts = candidate.trim().split(/\s+/);
  const typeIndex = parts.indexOf("typ");
  if (typeIndex === -1 || parts[typeIndex + 1] !== "srflx") return null;
  return parts[4] ?? null;
};

const isIPv4 = (address: string): boolean =>
  /^\d{1,3}(\.\d{1,3}){3}$/.test(address);

const expandIPv6Groups = (address: string): string[] => {
  const [head, tail = ""] = address.toLowerCase().split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const missing = 8 - headGroups.length - tailGroups.length;
  return [
    ...headGroups,
    ...Array.from({ length: Math.max(0, missing) }, () => "0"),
    ...tailGroups,
  ].map((group) => group.replace(/^0+(?=.)/, ""));
};

export const networkKeyOf = (address: string): string | null => {
  if (isIPv4(address)) return address;
  if (!address.includes(":")) return null;
  return expandIPv6Groups(address).slice(0, IPV6_NETWORK_GROUPS).join(":");
};

const lookUpNetworkKey = (timeoutMs: number): Promise<string | null> =>
  new Promise((resolve) => {
    let connection: RTCPeerConnection;
    try {
      connection = new RTCPeerConnection({
        iceServers: [{ urls: STUN_SERVERS }],
      });
    } catch {
      resolve(null);
      return;
    }

    let isSettled = false;
    let ipv6Network: string | null = null;
    const finish = (key: string | null) => {
      if (isSettled) return;
      isSettled = true;
      window.clearTimeout(timer);
      connection.onicecandidate = null;
      connection.close();
      resolve(key);
    };
    const timer = window.setTimeout(() => finish(ipv6Network), timeoutMs);

    connection.onicecandidate = ({ candidate }) => {
      if (!candidate) {
        finish(ipv6Network);
        return;
      }
      const address = publicAddressOf(candidate.candidate);
      if (!address) return;
      if (isIPv4(address)) finish(address);
      else ipv6Network ??= networkKeyOf(address);
    };

    connection.createDataChannel("probe");
    connection
      .createOffer()
      .then((offer) => connection.setLocalDescription(offer))
      .catch(() => finish(null));
  });

let cached: { room: string; until: number } | null = null;
let pending: Promise<string | null> | null = null;

export const deriveNetworkRoom = (
  timeoutMs = LOOKUP_TIMEOUT_MS,
): Promise<string | null> => {
  if (cached && cached.until > Date.now()) return Promise.resolve(cached.room);
  pending ??= lookUpNetworkKey(timeoutMs)
    .then((key) => {
      const room = key ? hashToRoom(key) : null;
      cached = room ? { room, until: Date.now() + CACHE_MS } : null;
      return room;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
};
