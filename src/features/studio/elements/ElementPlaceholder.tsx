import type { LucideIcon } from "lucide-react";
import { useRenderSurface } from "../render/renderSurface";

interface ElementPlaceholderProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
}

export const ElementPlaceholder = ({
  icon: Icon,
  title,
  hint,
}: ElementPlaceholderProps) => {
  const surface = useRenderSurface();
  if (surface === "output" || surface === "preview") return null;

  return (
    <div className="@container-size size-full overflow-hidden rounded-[inherit] border-4 border-dashed border-white/25 bg-white/6 text-white/75">
      <div className="flex size-full flex-col items-center justify-center gap-[min(16px,4cqmin)] p-[min(24px,5cqmin)] text-center">
        <Icon
          aria-hidden
          strokeWidth={1.6}
          className="size-[min(64px,26cqmin)] shrink-0"
        />
        <span className="text-[min(34px,11cqmin)] leading-tight font-semibold">
          {title}
        </span>
        {hint && (
          <span className="max-w-[85%] text-[min(24px,7cqmin)] leading-snug text-white/60">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
};
