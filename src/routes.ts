import type { MediaKind } from "./types";
import { PASSWORD_RESET_APP_PATH } from "./contracts/authContract";

export const NEW_MANUSCRIPT_ID = "new";
export const NEXT_PAGE_PARAM = "next";

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

const studio = () => `${home()}studio`;
const studioItem = (layerId = ":layerId") =>
  `${studio()}/items/${segment(layerId)}`;

const cameraShare = () => `${home()}camera`;

const share = () => `${home()}share`;

const assetUsages = () => `${home()}use`;
const assetUsage = (
  asset: UsageAsset | ":asset" = ":asset",
  assetId = ":assetId",
) => `${assetUsages()}/${asset}/${segment(assetId)}`;

const withNextPage = (path: string, next?: string) =>
  next && next !== home()
    ? `${path}?${NEXT_PAGE_PARAM}=${encodeURIComponent(next)}`
    : path;

const signIn = (next?: string) => withNextPage(`${home()}sign-in`, next);
const signUp = (next?: string) => withNextPage(`${home()}sign-up`, next);
const forgotPassword = () => `${home()}forgot-password`;
const resetPassword = () => PASSWORD_RESET_APP_PATH;
const account = () => `${home()}account`;

const admin = () => `${home()}admin`;
const analytics = () => `${admin()}/analytics`;

const presentWindow = () => `${home()}present`;
const studioWindow = () => `${home()}studio-live`;
const studioPreview = () => `${home()}studio-preview`;

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
  studio,
  studioItem,
  cameraShare,
  share,
  assetUsage,
  signIn,
  signUp,
  forgotPassword,
  resetPassword,
  account,
  admin,
  analytics,
  presentWindow,
  studioWindow,
  studioPreview,
  notFound,
};

export default routes;

export const isRoutePath = (candidate: string): boolean =>
  candidate.startsWith("/");

export const isSafeNextPath = (candidate: string | null): candidate is string =>
  candidate !== null &&
  isRoutePath(candidate) &&
  !candidate.startsWith("//") &&
  !candidate.startsWith("/\\");

export const isRouteActive = (route: string, pathname: string): boolean =>
  route === dashboard()
    ? pathname === route
    : pathname === route || pathname.startsWith(`${route}/`);

const SELF_SCROLLING_PAGES = [bible(), themes(), studio()];

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
