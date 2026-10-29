import type { SecondaryPresentState } from "../../../lib/presentChannel";

export const secondaryLabel = (secondary: SecondaryPresentState): string =>
  secondary.kind === "stream"
    ? "Live camera"
    : (secondary.item?.name ?? "Missing item");
