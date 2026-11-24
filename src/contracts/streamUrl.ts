import { z } from "zod";

const STREAM_PROTOCOLS = new Set(["rtmp:", "rtmps:"]);
const MAX_SERVER_URL_LENGTH = 1024;
const MAX_STREAM_KEY_LENGTH = 512;
const MAX_STREAM_URL_LENGTH = 2048;
const MIN_STREAM_KEY_LENGTH = 4;

const PRIVATE_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".lan"];

const isPrivateIPv4 = (host: string): boolean => {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part)))
    return false;
  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const isPrivateIPv6 = (host: string): boolean => {
  const bare = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (!bare.includes(":")) return false;
  return (
    bare === "::" ||
    bare === "::1" ||
    bare.startsWith("fe80:") ||
    bare.startsWith("fc") ||
    bare.startsWith("fd") ||
    bare.startsWith("::ffff:")
  );
};

export const isPrivateHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();
  return (
    host === "" ||
    host === "localhost" ||
    PRIVATE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
    isPrivateIPv4(host) ||
    isPrivateIPv6(host)
  );
};

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const pathSegments = (url: URL): string[] =>
  url.pathname.split("/").filter(Boolean);

type StreamUrlProblem = string | null;

const urlShapeProblem = (url: URL | null): StreamUrlProblem => {
  if (!url) return "Enter a full address that starts with rtmp:// or rtmps://.";
  if (!STREAM_PROTOCOLS.has(url.protocol))
    return "Use an rtmp:// or rtmps:// address from the platform.";
  if (url.username || url.password)
    return "Remove the user name and password from the address.";
  return null;
};

export const serverUrlProblem = (value: string): StreamUrlProblem => {
  const url = parseUrl(value);
  const problem = urlShapeProblem(url);
  if (problem || !url) return problem;
  if (isPrivateHost(url.hostname))
    return "Use the platform's public streaming address, not a local one.";
  if (url.hash || url.search)
    return "Paste only the server address here. The stream key goes in its own box.";
  if (pathSegments(url).length === 0)
    return "The server address is missing its path, for example /live2.";
  return null;
};

export const streamKeyProblem = (value: string): StreamUrlProblem => {
  if (value.length < MIN_STREAM_KEY_LENGTH) return "Paste the full stream key.";
  if (value.length > MAX_STREAM_KEY_LENGTH)
    return "This stream key is too long.";
  if (!/^[\x21-\x7E]+$/.test(value))
    return "Stream keys cannot contain spaces or special characters.";
  return null;
};

const streamUrlProblem = (value: string): StreamUrlProblem => {
  if (/\s/.test(value)) return "Stream addresses cannot contain spaces.";
  const url = parseUrl(value);
  const problem = urlShapeProblem(url);
  if (problem || !url) return problem;
  if (pathSegments(url).length < 2) return "The stream key is missing.";
  return null;
};

const refinedWith =
  (findProblem: (value: string) => StreamUrlProblem) =>
  (value: string, context: z.RefinementCtx): void => {
    const problem = findProblem(value);
    if (problem)
      context.addIssue({ code: z.ZodIssueCode.custom, message: problem });
  };

export const streamServerUrlSchema = z
  .string()
  .trim()
  .max(MAX_SERVER_URL_LENGTH)
  .superRefine(refinedWith(serverUrlProblem));

export const streamKeySchema = z
  .string()
  .trim()
  .max(MAX_STREAM_KEY_LENGTH)
  .superRefine(refinedWith(streamKeyProblem));

export const streamUrlSchema = z
  .string()
  .max(MAX_STREAM_URL_LENGTH)
  .superRefine(refinedWith(streamUrlProblem));

export const buildStreamUrl = (serverUrl: string, streamKey: string): string =>
  `${serverUrl.trim().replace(/\/+$/, "")}/${streamKey.trim()}`;

const RTMP_URL_PATTERN = /^(rtmps?:\/\/)(.*\/)(.*\/)(\S*)( live=1)?$/;
const REDACTED_IDENTIFIER_PATTERN = /^\{[^{}]*\.\.\.[^{}]*\}$/;

export const redactIdentifier = (identifier: string): string => {
  for (let keep = 3; keep > 0; keep -= 1)
    if (identifier.length >= keep * 3)
      return `{${identifier.slice(0, keep)}...${identifier.slice(-keep)}}`;
  return "{...}";
};

const redactQueryValues = (url: string): string => {
  const separator = url.indexOf("?");
  if (separator === -1 || separator === url.length - 1) return url;
  const params = url
    .slice(separator + 1)
    .split("&")
    .map((param) => {
      const equals = param.indexOf("=");
      return equals !== -1 && equals < param.length - 1
        ? `${param.slice(0, equals)}={...}`
        : param;
    });
  return `${url.slice(0, separator)}?${params.join("&")}`;
};

export const redactStreamKey = (url: string): string => {
  const match = RTMP_URL_PATTERN.exec(url);
  if (!match) return redactQueryValues(url);
  const [, scheme, host, app, key, liveFlag = ""] = match;
  return `${scheme}${host}${app}${redactIdentifier(key)}${liveFlag}`;
};

const isRedactedStreamUrl = (url: string): boolean => {
  const match = RTMP_URL_PATTERN.exec(url);
  return match !== null && REDACTED_IDENTIFIER_PATTERN.test(match[4]);
};

export const redactStreamUrlsInText = (text: string): string =>
  text.replace(/rtmps?:\/\/\S+/g, (url) =>
    isRedactedStreamUrl(url) ? url : redactStreamKey(url),
  );

export const streamKeyEnding = (streamKey: string): string =>
  streamKey.trim().slice(-4);
