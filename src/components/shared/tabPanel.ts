const pillTabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;

const pillTabPanelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

export const externalPanelProps = (prefix: string | undefined, id: string) =>
  prefix
    ? { id: pillTabId(prefix, id), "aria-controls": pillTabPanelId(prefix, id) }
    : {};

export const pillTabPanelProps = (prefix: string, id: string) => ({
  role: "tabpanel",
  id: pillTabPanelId(prefix, id),
  "aria-labelledby": pillTabId(prefix, id),
});
