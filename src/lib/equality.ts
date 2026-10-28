const definedKeys = (value: object): string[] =>
  Object.keys(value).filter(
    (key) => (value as Record<string, unknown>)[key] !== undefined,
  );

const isComparableObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

export const shallowEqual = <T extends object>(a: T, b: T): boolean => {
  if (a === b) return true;
  const keys = definedKeys(a);
  if (keys.length !== definedKeys(b).length) return false;
  return keys.every((key) =>
    Object.is(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
};

export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (!isComparableObject(a) || !isComparableObject(b)) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = definedKeys(a);
  if (keys.length !== definedKeys(b).length) return false;
  return keys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
  );
};
