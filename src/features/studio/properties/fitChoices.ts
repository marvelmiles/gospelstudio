import type { MediaFit } from "../../../types";
import type { Choice } from "./fields";

export const FIT_CHOICES: Choice<MediaFit>[] = [
  { value: "cover", label: "Fill" },
  { value: "contain", label: "Fit" },
  { value: "fill", label: "Stretch" },
];
