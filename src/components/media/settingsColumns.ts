export const settingsColumns = (narrow?: boolean): string =>
  narrow
    ? "grid-cols-1"
    : "grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))]";
