/*
 * The app never stores its own address. In the browser it is the address the app was
 * opened on. Static files (the page HTML, sitemap.xml and robots.txt) are built with
 * APP_ORIGIN_PLACEHOLDER, and the Netlify edge function in netlify/edge-functions fills
 * it in with the address each request came to. This module must stay free of imports,
 * because that edge function imports it too.
 */
export const APP_ORIGIN_PLACEHOLDER = "__APP_ORIGIN__";

const FILLED_CONTENT_TYPES = [
  "text/html",
  "text/plain",
  "text/xml",
  "application/xml",
];

export const currentAppOrigin = (): string => window.location.origin;

export const appUrl = (
  path: string,
  origin: string = currentAppOrigin(),
): string => `${origin.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

export const withAppOrigin = async (
  response: Response,
  origin: string,
): Promise<Response> => {
  const contentType = response.headers.get("content-type") ?? "";
  const isFilled = FILLED_CONTENT_TYPES.some((type) =>
    contentType.startsWith(type),
  );
  if (!isFilled || response.body === null) return response;
  const text = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(text.split(APP_ORIGIN_PLACEHOLDER).join(origin), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
