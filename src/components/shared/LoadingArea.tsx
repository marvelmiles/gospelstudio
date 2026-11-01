import { AppIconLoader } from "./AppIconLoader";

export const LoadingArea = ({ size = 56 }: { size?: number }) => (
  <div className="grid size-full min-h-30 place-items-center">
    <AppIconLoader size={size} />
  </div>
);
