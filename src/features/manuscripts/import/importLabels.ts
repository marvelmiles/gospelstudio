import type { DocumentReadFailure } from "../../../lib/documents/documentReadError";

export type SkipReason = DocumentReadFailure | "in-library" | "repeated";

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  unsupported: "Not a Word, rich text or plain text file",
  empty: "No text found",
  protected: "Password protected",
  outdated: "Made by a Word older than 97. Save it again in Word first",
  "too-large": "Larger than 50 MB",
  unreadable: "Could not be read",
  "in-library": "Already in your library",
  repeated: "Same text as another file here",
};

export const SUPPORTED_FORMATS_LABEL = ".doc, .docx, .rtf, .txt and .md";
