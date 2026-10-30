import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { APP_INSTALL_NAME, APP_NAME, APP_URL } from "./app.config";
import { PAGE_META, pageUrl, type PageMeta } from "./src/lib/pageMeta";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version: string };

const HTML_IDENTITY: Record<string, string> = { APP_NAME, APP_URL };

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const fillPlaceholders = (
  html: string,
  values: Record<string, string>,
): string =>
  html.replace(
    /\{\{([A-Z_]+)\}\}/g,
    (match, key: string) => values[key] ?? match,
  );

const pagePlaceholders = (meta: PageMeta): Record<string, string> => ({
  PAGE_TITLE: escapeHtml(meta.title),
  PAGE_DESCRIPTION: escapeHtml(meta.description),
  PAGE_URL: escapeHtml(pageUrl(meta)),
});

const pageHtmlFileName = (meta: PageMeta): string =>
  `${meta.path.slice(1)}.html`;

const appHtmlIdentity = (): Plugin => ({
  name: "app-html-identity",
  enforce: "post",
  transformIndexHtml: {
    order: "pre",
    handler: (html, { server }) =>
      fillPlaceholders(
        html,
        server
          ? { ...HTML_IDENTITY, ...pagePlaceholders(PAGE_META.home) }
          : HTML_IDENTITY,
      ),
  },
  generateBundle(_options, bundle) {
    const index = bundle["index.html"];
    if (index?.type !== "asset") return;
    const template = String(index.source);
    for (const meta of Object.values(PAGE_META)) {
      const source = fillPlaceholders(template, pagePlaceholders(meta));
      if (meta.path === PAGE_META.home.path) index.source = source;
      else
        this.emitFile({
          type: "asset",
          fileName: pageHtmlFileName(meta),
          source,
        });
    }
  },
});

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  json: {
    stringify: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    appHtmlIdentity(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: [
        "favicon.svg",
        "icon.svg",
        "robots.txt",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-512.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: APP_INSTALL_NAME,
        short_name: APP_NAME,
        description:
          "Present songs, Bible passages, images and videos live, installable and offline-ready.",
        lang: "en",
        dir: "ltr",
        theme_color: "#101013",
        background_color: "#101013",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        categories: ["productivity", "utilities", "education", "music"],
        shortcuts: [
          { name: "Manuscripts", url: "/manuscripts" },
          { name: "Bible", url: "/bible" },
          { name: "Stream", url: "/stream" },
        ],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/assets/images/") ||
              url.pathname.startsWith("/assets/videos/"),
            handler: "CacheFirst",
            options: {
              cacheName: "background-assets",
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
        suppressWarnings: true,
      },
    }),
  ],
});
