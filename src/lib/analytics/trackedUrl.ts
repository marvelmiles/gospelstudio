import routes from "../../routes";

const KEPT_QUERY_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
  "source",
];

export const UNKNOWN_PAGE_PATH = "/unknown-page";

const TRACKED_ROUTE_PATTERNS = [
  routes.dashboard(),
  routes.manuscripts(),
  routes.newManuscript(),
  routes.manuscript(),
  routes.bible(),
  routes.passage(),
  routes.images(),
  routes.image(),
  routes.videos(),
  routes.video(),
  routes.sound(),
  routes.assetUsage(),
  routes.themes(),
  routes.theme(),
  routes.studio(),
  routes.studioItem(),
  routes.cameraShare(),
  routes.share(),
];

const UNTRACKED_ROUTE_PREFIXES = [routes.admin()];

const pathSegments = (path: string): string[] =>
  path.split("/").filter(Boolean);

const matchesPattern = (segments: string[], pattern: string): boolean => {
  const patternSegments = pathSegments(pattern);
  return (
    patternSegments.length === segments.length &&
    patternSegments.every(
      (part, index) => part.startsWith(":") || part === segments[index],
    )
  );
};

export const trackedPath = (pathname: string): string => {
  const segments = pathSegments(pathname);
  return (
    TRACKED_ROUTE_PATTERNS.find((pattern) =>
      matchesPattern(segments, pattern),
    ) ?? UNKNOWN_PAGE_PATH
  );
};

const isUntrackedPath = (pathname: string): boolean =>
  UNTRACKED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const parseUrl = (href: string): URL | null => {
  try {
    return new URL(href);
  } catch {
    return null;
  }
};

const keptQuery = (url: URL): string => {
  const kept = new URLSearchParams();
  for (const name of KEPT_QUERY_PARAMETERS) {
    const value = url.searchParams.get(name);
    if (value) kept.set(name, value);
  }
  const query = kept.toString();
  return query ? `?${query}` : "";
};

export const trackedUrl = (href: string): string | null => {
  const url = parseUrl(href);
  if (!url || isUntrackedPath(url.pathname)) return null;
  return `${url.origin}${trackedPath(url.pathname)}${keptQuery(url)}`;
};

export const trackedReferrer = (
  referrer: string | null | undefined,
  pageOrigin: string,
): string | null => {
  if (!referrer) return null;
  const url = parseUrl(referrer);
  if (!url) return null;
  if (url.origin !== pageOrigin) return referrer;
  return `${url.origin}${trackedPath(url.pathname)}`;
};
