import { useDocumentTitle as useTitle } from "usehooks-ts";
import { documentTitle } from "../lib/appInfo";

export const useDocumentTitle = (page: string): void =>
  useTitle(documentTitle(page), { preserveTitleOnUnmount: false });
