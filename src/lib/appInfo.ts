export { APP_NAME } from "../../app.config";
import { APP_NAME, APP_TITLE } from "../../app.config";

declare const __APP_VERSION__: string;

const APP_VERSION: string = __APP_VERSION__;

export const APP_VERSION_LABEL = `v${APP_VERSION}`;

export const documentTitle = (page?: string): string =>
  page ? `${page} · ${APP_NAME}` : APP_TITLE;
