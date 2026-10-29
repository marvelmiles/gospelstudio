import { useState } from "react";

const NOT_SEEN = Symbol("not seen");

interface ValueChangeOptions {
  onMount?: boolean;
}

export const useValueChange = <T>(
  value: T,
  onChange: (next: T) => void,
  { onMount = false }: ValueChangeOptions = {},
): void => {
  const [previous, setPrevious] = useState<T | typeof NOT_SEEN>(
    onMount ? NOT_SEEN : value,
  );
  if (Object.is(previous, value)) return;
  setPrevious(value);
  onChange(value);
};
