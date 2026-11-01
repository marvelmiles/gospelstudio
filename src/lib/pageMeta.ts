import {
  APP_CATEGORY,
  APP_DESCRIPTION,
  APP_NAME,
  APP_TITLE,
  APP_URL,
} from "../../app.config";
import routes from "../routes";

export interface PageMeta {
  path: string;
  title: string;
  description: string;
}

const modulePage = (
  path: string,
  name: string,
  description: string,
): PageMeta => ({
  path,
  title: `${name} · ${APP_NAME} | ${APP_CATEGORY} Software`,
  description,
});

export const PAGE_META = {
  home: { path: routes.home(), title: APP_TITLE, description: APP_DESCRIPTION },
  manuscripts: modulePage(
    routes.manuscripts(),
    "Manuscripts",
    "Paste song lyrics, hymns or a sermon outline and get clean slides, ready to show on a projector or TV.",
  ),
  bible: modulePage(
    routes.bible(),
    "Bible",
    "Find any verse in the King James or American Standard Version and put it on the big screen in seconds, even without internet.",
  ),
  images: modulePage(
    routes.images(),
    "Images",
    "Keep your church pictures in one place and show them full screen or behind your song lyrics and Bible verses.",
  ),
  videos: modulePage(
    routes.videos(),
    "Videos",
    "Play videos on the big screen, trim them, and use them as moving backgrounds behind your slides.",
  ),
  themes: modulePage(
    routes.themes(),
    "Themes",
    "Save a look once, with fonts, colors, backgrounds and slide animations, and use it on every song and Bible passage.",
  ),
  studio: modulePage(
    routes.studio(),
    "Studio",
    "Put a live camera, Bible verses, song lyrics, pictures and captions on the big screen together, and switch layouts with one click.",
  ),
  camera: modulePage(
    routes.cameraShare(),
    "Camera",
    "Turn a phone or laptop into a live camera for the Studio. Pair it over WiFi in one tap, or with a code when there is no internet.",
  ),
  share: modulePage(
    routes.share(),
    "Share",
    "Send songs, Bible passages, studio productions, pictures and videos straight to another device on the same WiFi, with no cables or uploads.",
  ),
} satisfies Record<string, PageMeta>;

export type PageName = keyof typeof PAGE_META;

export const pageUrl = (meta: PageMeta): string =>
  new URL(meta.path, APP_URL).href;
