import { DEVICE_NAME_MAX_LENGTH } from "@/contracts/accountContract";
import { detectDeviceName } from "../../../lib/deviceName";

const BROWSERS: { name: string; pattern: RegExp }[] = [
  { name: "Edge", pattern: /Edg\// },
  { name: "Opera", pattern: /OPR\// },
  { name: "Samsung Internet", pattern: /SamsungBrowser\// },
  { name: "Firefox", pattern: /Firefox\// },
  { name: "Chrome", pattern: /Chrome\// },
  { name: "Safari", pattern: /Safari\// },
];

const browserName = (userAgent: string): string | null =>
  BROWSERS.find((browser) => browser.pattern.test(userAgent))?.name ?? null;

export const sessionDeviceName = async (): Promise<string> => {
  const device = await detectDeviceName();
  const browser = browserName(navigator.userAgent);
  const name = browser ? `${browser} on ${device}` : device;
  return name.slice(0, DEVICE_NAME_MAX_LENGTH);
};
