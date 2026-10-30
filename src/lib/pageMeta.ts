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
  stream: modulePage(
    routes.stream(),
    "Stream",
    "Run a live broadcast with phone cameras. Show them on the big screen and add text, announcements and pictures on top.",
  ),
  share: modulePage(
    routes.share(),
    "Quick Share",
    "Send songs, Bible passages, pictures and videos straight to another device on the same WiFi, with no cables or uploads.",
  ),
} satisfies Record<string, PageMeta>;

export type PageName = keyof typeof PAGE_META;

export const pageUrl = (meta: PageMeta): string =>
  new URL(meta.path, APP_URL).href;
