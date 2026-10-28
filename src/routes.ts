import type { MediaKind } from "./types";

export const NEW_MANUSCRIPT_ID = "new";

type UsageAsset = "background" | "sound";

const segment = (value: string): string =>
  value.startsWith(":") ? value : encodeURIComponent(value);

const home = () => "/";

const dashboard = () => home();

const manuscripts = () => `${home()}manuscripts`;
const manuscript = (manuscriptId = ":manuscriptId") =>
  `${manuscripts()}/${segment(manuscriptId)}`;
const newManuscript = () => manuscript(NEW_MANUSCRIPT_ID);

const bible = () => `${home()}bible`;
const passages = () => `${home()}scripture`;
const passage = (passageId = ":passageId") =>
  `${passages()}/${segment(passageId)}`;

const images = () => `${home()}images`;
const image = (mediaId = ":mediaId") => `${images()}/${segment(mediaId)}`;
const videos = () => `${home()}videos`;
const video = (mediaId = ":mediaId") => `${videos()}/${segment(mediaId)}`;

const mediaLibrary = (kind: MediaKind) =>
  kind === "image" ? images() : videos();
const mediaItem = (kind: MediaKind, mediaId = ":mediaId") =>
  kind === "image" ? image(mediaId) : video(mediaId);

const sounds = () => `${home()}audio`;
const sound = (audioId = ":audioId") => `${sounds()}/${segment(audioId)}`;

const themes = () => `${home()}themes`;
const theme = (themeId = ":themeId") => `${themes()}/${segment(themeId)}`;

const stream = () => `${home()}stream`;

const share = () => `${home()}share`;

const assetUsages = () => `${home()}use`;
const assetUsage = (
  asset: UsageAsset | ":asset" = ":asset",
  assetId = ":assetId",
) => `${assetUsages()}/${asset}/${segment(assetId)}`;

const presentWindow = () => `${home()}present`;
const streamWindow = () => `${home()}stream-live`;

const notFound = () => "*";

const routes = {
  home,
  dashboard,
  manuscripts,
  manuscript,
  newManuscript,
  bible,
  passages,
  passage,
  images,
  image,
  videos,
  video,
  mediaLibrary,
  mediaItem,
  sounds,
  sound,
  themes,
  theme,
  stream,
  share,
  assetUsage,
  presentWindow,
  streamWindow,
  notFound,
};

export default routes;

export const isRoutePath = (candidate: string): boolean =>
  candidate.startsWith("/");

export const isRouteActive = (route: string, pathname: string): boolean =>
  route === dashboard()
    ? pathname === route
    : pathname === route || pathname.startsWith(`${route}/`);

const SELF_SCROLLING_PAGES = [bible(), themes()];

const SELF_SCROLLING_EDITORS = [
  passages(),
  manuscripts(),
  images(),
  videos(),
  sounds(),
  assetUsages(),
];

export const isSelfScrollingRoute = (pathname: string): boolean =>
  SELF_SCROLLING_PAGES.some((route) => isRouteActive(route, pathname)) ||
  SELF_SCROLLING_EDITORS.some((route) => pathname.startsWith(`${route}/`));
