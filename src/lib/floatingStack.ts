const BASE_Z = 160;

let order: string[] = [];
const listeners = new Set<() => void>();

const publish = (next: string[]): void => {
  order = next;
  for (const listener of listeners) listener();
};

export const subscribeFloatingStack = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const registerFloating = (id: string): void => {
  if (order.includes(id)) return;
  publish([...order, id]);
};

export const releaseFloating = (id: string): void => {
  if (!order.includes(id)) return;
  publish(order.filter((entry) => entry !== id));
};

export const raiseFloating = (id: string): void => {
  if (order[order.length - 1] === id) return;
  publish([...order.filter((entry) => entry !== id), id]);
};

export const floatingZIndex = (id: string): number =>
  BASE_Z + Math.max(0, order.indexOf(id));
