import { isTextEntryTarget } from "./textEntry";

const MEDIA_SURFACE_ATTR = "data-media-surface";

export const mediaSurfaceProps = { [MEDIA_SURFACE_ATTR]: "" } as const;

const MEDIA_SURFACE_SELECTOR = `[${MEDIA_SURFACE_ATTR}]`;

const SPACE_ACTIVATED_SELECTOR = [
  "button",
  "summary",
  '[role="button"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="menuitem"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="file"]',
].join(", ");

const isSpaceKey = (key: string): boolean => key === " " || key === "Spacebar";

const asElement = (target: EventTarget | null): HTMLElement | null =>
  target instanceof HTMLElement ? target : null;

const isInsideMediaSurface = (target: EventTarget | null): boolean => {
  return Boolean(asElement(target)?.closest(MEDIA_SURFACE_SELECTOR));
};

export const activatesOnSpace = (target: EventTarget | null): boolean => {
  return Boolean(asElement(target)?.closest(SPACE_ACTIVATED_SELECTOR));
};

export const clipOwnsSpace = (event: KeyboardEvent): boolean => {
  if (!isSpaceKey(event.key)) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (isTextEntryTarget(event.target)) return false;
  if (isInsideMediaSurface(event.target)) return true;
  return !activatesOnSpace(event.target);
};

const SLIDER_OWNED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

const isSliderTarget = (target: EventTarget | null): boolean => {
  const element = asElement(target);
  return (
    element?.tagName === "INPUT" &&
    ((element as HTMLInputElement).type === "range" ||
      element.getAttribute("role") === "slider")
  );
};

export const targetOwnsKey = (event: KeyboardEvent): boolean => {
  if (isTextEntryTarget(event.target)) return true;
  return isSliderTarget(event.target) && SLIDER_OWNED_KEYS.has(event.key);
};
