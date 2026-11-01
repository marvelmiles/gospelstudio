import { z } from "zod";
import routes from "../../../routes";

const ROOM_PARAM = "room";
const STUDIO_PARAM = "studio";
const OFFER_KEY = "offer";
const OFFER_MARKER = `#${OFFER_KEY}=`;

const studioLinkSchema = z.object({
  room: z.string().regex(/^net-[0-9a-z]{1,16}$/),
  studio: z.string().regex(/^[0-9a-f-]{8,64}$/),
});

export type StudioLink = z.infer<typeof studioLinkSchema>;

export interface CameraLinkRequest {
  studio: StudioLink | null;
  offerCode: string | null;
}

const cameraPageUrl = (): URL =>
  new URL(routes.cameraShare(), window.location.origin);

export const studioLinkUrl = (link: StudioLink): string => {
  const url = cameraPageUrl();
  url.searchParams.set(ROOM_PARAM, link.room);
  url.searchParams.set(STUDIO_PARAM, link.studio);
  return url.href;
};

const fragmentSafe = (code: string): string =>
  code.replace(/%/g, "%25").replace(/ /g, "%20");

export const offerLinkUrl = (offerCode: string): string =>
  `${cameraPageUrl().href}${OFFER_MARKER}${fragmentSafe(offerCode)}`;

export const offerCodeFromText = (text: string): string => {
  const markerIndex = text.indexOf(OFFER_MARKER);
  if (markerIndex < 0) return text;
  try {
    return decodeURIComponent(text.slice(markerIndex + OFFER_MARKER.length));
  } catch {
    return text;
  }
};

export const readCameraLink = (url: URL): CameraLinkRequest => {
  const studio = studioLinkSchema.safeParse({
    room: url.searchParams.get(ROOM_PARAM),
    studio: url.searchParams.get(STUDIO_PARAM),
  });
  const offerCode = url.hash.startsWith(OFFER_MARKER)
    ? offerCodeFromText(url.hash)
    : null;
  return { studio: studio.success ? studio.data : null, offerCode };
};
