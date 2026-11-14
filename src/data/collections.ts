export const COLLECTIONS = [
  "Hymns",
  "Worship",
  "Praise",
  "Special Songs",
  "Choir Ministration",
  "Sermons",
  "General",
] as const;

export type Collection = (typeof COLLECTIONS)[number];

export const isCollection = (value: string): value is Collection =>
  (COLLECTIONS as readonly string[]).includes(value);

export const DEFAULT_COLLECTION: Collection = "General";

export const SERMON_COLLECTION: Collection = "Sermons";
