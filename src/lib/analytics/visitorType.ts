import type { VisitorType } from "./analyticsEvents";

const FIRST_ACTIVE_DAY_KEY = "gospelstudio:first-active-day";
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const twoDigits = (value: number): string => String(value).padStart(2, "0");

export const localDay = (date: Date): string =>
  `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;

export const validFirstActiveDay = (
  stored: string | null,
  today: string,
): string | null =>
  stored && DAY_PATTERN.test(stored) && stored <= today ? stored : null;

export const classifyVisitor = (
  firstActiveDay: string | null,
  today: string,
): VisitorType =>
  firstActiveDay !== null && firstActiveDay < today ? "returning" : "new";

export const resolveVisitorType = (
  now: Date = new Date(),
): VisitorType | null => {
  const today = localDay(now);
  try {
    const firstActiveDay = validFirstActiveDay(
      localStorage.getItem(FIRST_ACTIVE_DAY_KEY),
      today,
    );
    if (!firstActiveDay) localStorage.setItem(FIRST_ACTIVE_DAY_KEY, today);
    return classifyVisitor(firstActiveDay, today);
  } catch {
    return null;
  }
};

export const forgetVisitorType = (): void => {
  try {
    localStorage.removeItem(FIRST_ACTIVE_DAY_KEY);
  } catch {}
};
