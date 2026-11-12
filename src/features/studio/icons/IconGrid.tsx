import { cn } from "../../../lib/utils";
import { ICONS, ICON_ORDER, type IconName } from "../lib/iconCatalog";

interface IconGridProps {
  value?: IconName;
  onChoose: (icon: IconName) => void;
}

export const IconGrid = ({ value, onChoose }: IconGridProps) => (
  <div
    role={value ? "radiogroup" : undefined}
    aria-label="Icons"
    className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-1.5"
  >
    {ICON_ORDER.map((name) => {
      const { label, icon: Icon } = ICONS[name];
      const isActive = name === value;
      return (
        <button
          key={name}
          type="button"
          role={value ? "radio" : undefined}
          aria-checked={value ? isActive : undefined}
          onClick={() => onChoose(name)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-[11.5px] font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isActive
              ? "border-primary/60 bg-primary/14 text-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/45 hover:text-foreground",
          )}
        >
          <Icon aria-hidden size={24} className="text-primary-soft" />
          <span className="w-full truncate text-center">{label}</span>
        </button>
      );
    })}
  </div>
);
