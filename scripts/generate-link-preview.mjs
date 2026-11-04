import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import sharp from "sharp";
import { createServer } from "vite";

const OUTPUT = "public/link-preview.jpg";
const WIDTH = 1200;
const HEIGHT = 630;
const PIXEL_RATIO = 2;
const JPEG_QUALITY = 82;
const POLL_INTERVAL_MS = 500;
const TIMEOUT_MS = 180_000;
const SETTLE_MS = 1500;

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/microsoft-edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const DASHBOARD_READY = `import("/src/store/useStore.ts")
  .then(({ useStore }) => {
    const state = useStore.getState();
    if (state.loading) return false;
    if (state.showGuide) state.completeGuide();
    return Boolean(document.querySelector("h1")) && !document.querySelector('[role="dialog"]');
  })
  .catch(() => false)`;

const findBrowser = () => {
  const browser = BROWSER_CANDIDATES.find((path) => path && existsSync(path));
  if (!browser)
    throw new Error("No Edge or Chrome found. Set BROWSER_PATH to one.");
  return browser;
};

const waitFor = async (check, label) => {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

const readDevToolsAddress = (profileDir) => {
  const file = join(profileDir, "DevToolsActivePort");
  if (!existsSync(file)) return undefined;
  const [port, browserPath] = readFileSync(file, "utf8").split("\n");
  return browserPath ? `ws://127.0.0.1:${port}${browserPath}` : undefined;
};

const connectDevTools = (address) =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(address);
    const pending = new Map();
    let lastId = 0;
    socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      const call = pending.get(message.id);
      if (!call) return;
      pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message));
      else call.resolve(message.result);
    };
    socket.onerror = () => reject(new Error("Could not reach the browser"));
    socket.onopen = () =>
      resolve({
        send: (method, params = {}, sessionId) =>
          new Promise((resolveCall, rejectCall) => {
            lastId += 1;
            pending.set(lastId, { resolve: resolveCall, reject: rejectCall });
            socket.send(
              JSON.stringify({ id: lastId, method, params, sessionId }),
            );
          }),
        close: () => socket.close(),
      });
  });

const openPage = async (browser) => {
  const { targetId } = await browser.send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await browser.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  return (method, params) => browser.send(method, params, sessionId);
};

const evaluate = async (page, expression) => {
  const { result } = await page("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.value;
};

const captureDashboard = async (page, url) => {
  await page("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: PIXEL_RATIO,
    mobile: false,
  });
  await page("Page.navigate", { url });
  await waitFor(() => evaluate(page, DASHBOARD_READY), "the home page");
  await evaluate(page, "document.fonts.ready.then(() => true)");
  await delay(SETTLE_MS);
  const { data } = await page("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  return Buffer.from(data, "base64");
};

const server = await createServer({ logLevel: "error" });
await server.listen();
const profileDir = mkdtempSync(join(tmpdir(), "gospelstudio-preview-"));
const browserProcess = spawn(
  findBrowser(),
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDir}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
  ],
  { stdio: "ignore" },
);

try {
  const browser = await connectDevTools(
    await waitFor(() => readDevToolsAddress(profileDir), "the browser"),
  );
  const screenshot = await captureDashboard(
    await openPage(browser),
    server.resolvedUrls.local[0],
  );
  const { size } = await sharp(screenshot)
    .resize(WIDTH, HEIGHT)
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(OUTPUT);
  console.log(`${OUTPUT} (${WIDTH}x${HEIGHT}, ${Math.round(size / 1024)} KB)`);
  const exited = once(browserProcess, "exit");
  await browser.send("Browser.close");
  browser.close();
  await exited;
} finally {
  if (browserProcess.exitCode === null) browserProcess.kill();
  await server.close();
  rmSync(profileDir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  });
}
