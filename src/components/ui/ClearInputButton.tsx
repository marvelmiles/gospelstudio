import { X } from "lucide-react";

interface ClearInputButtonProps {
  value: string;
  onClear: () => void;
  label?: string;
}

export const ClearInputButton = ({
  value,
  onClear,
  label = "Clear search",
}: ClearInputButtonProps) => {
  if (!value) return null;

  return (
    <button
      type="button"
      onClick={onClear}
      title={label}
      aria-label={label}
      className="absolute top-2 right-2 grid size-6 place-items-center rounded-[7px] border-none bg-fg/8 p-0 text-sub"
    >
      <X size={13} />
    </button>
  );
};
