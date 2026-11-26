import { withAppOrigin } from "../../src/lib/appOrigin.ts";

interface EdgeContext {
  next(): Promise<Response>;
}

export default async (
  request: Request,
  context: EdgeContext,
): Promise<Response> =>
  withAppOrigin(await context.next(), new URL(request.url).origin);

export const config = {
  path: "/*",
  excludedPath: [
    "/assets/*",
    "/*.js",
    "/*.css",
    "/*.png",
    "/*.jpg",
    "/*.svg",
    "/*.ico",
    "/*.webmanifest",
    "/*.json",
    "/*.woff2",
    "/*.wasm",
  ],
};
