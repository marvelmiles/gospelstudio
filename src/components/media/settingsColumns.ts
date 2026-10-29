export const settingsColumns = (narrow?: boolean): string =>
  narrow ? "grid-cols-1" : "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]";
