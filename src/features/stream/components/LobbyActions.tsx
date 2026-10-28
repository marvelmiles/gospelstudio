import type { ReactNode } from "react";

export const LobbyActions = ({ children }: { children: ReactNode }) => (
  <div className="mt-4 flex flex-wrap justify-center gap-2.5">{children}</div>
);
