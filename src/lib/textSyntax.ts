import type { Slide } from "../types";

export type TextSyntax = "lists" | "plain";

export const SCRIPTURE_SLIDE_TYPE = "scripture";

export const slideBodySyntax = (slide: Pick<Slide, "type">): TextSyntax =>
  slide.type === SCRIPTURE_SLIDE_TYPE ? "plain" : "lists";
