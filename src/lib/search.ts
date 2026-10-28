const NON_SEARCHABLE = /[^\p{L}\p{N}]+/gu;

const normalizeSearchText = (value: string): string =>
  value.toLowerCase().replace(NON_SEARCHABLE, " ").trim();

export const buildSearchIndex = (
  fields: (string | undefined | null)[],
): string => normalizeSearchText(fields.filter(Boolean).join(" "));

export const matchesSearch = (index: string, term: string): boolean => {
  const needle = normalizeSearchText(term);
  return needle ? index.includes(needle) : true;
};
