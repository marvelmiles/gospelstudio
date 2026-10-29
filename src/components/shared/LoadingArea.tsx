import { Spinner } from "@/components/ui/spinner";

export const LoadingArea = ({ size = 26 }: { size?: number }) => (
  <div className="grid size-full min-h-30 place-items-center">
    <Spinner size={size} />
  </div>
);
