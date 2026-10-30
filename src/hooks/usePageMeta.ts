import { useEffect } from "react";
import {
  PAGE_META,
  pageUrl,
  type PageMeta,
  type PageName,
} from "../lib/pageMeta";

const setHeadAttribute = (
  selector: string,
  attribute: string,
  value: string,
): void => {
  document.head.querySelector(selector)?.setAttribute(attribute, value);
};

const applyPageMeta = (meta: PageMeta): void => {
  const url = pageUrl(meta);
  document.title = meta.title;
  setHeadAttribute('meta[name="description"]', "content", meta.description);
  setHeadAttribute('meta[property="og:title"]', "content", meta.title);
  setHeadAttribute(
    'meta[property="og:description"]',
    "content",
    meta.description,
  );
  setHeadAttribute('meta[property="og:url"]', "content", url);
  setHeadAttribute('meta[name="twitter:title"]', "content", meta.title);
  setHeadAttribute(
    'meta[name="twitter:description"]',
    "content",
    meta.description,
  );
  setHeadAttribute('link[rel="canonical"]', "href", url);
};

export const usePageMeta = (page: PageName): void => {
  useEffect(() => {
    applyPageMeta(PAGE_META[page]);
    return () => applyPageMeta(PAGE_META.home);
  }, [page]);
};
