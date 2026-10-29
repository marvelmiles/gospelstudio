import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoTip } from "@/components/shared/InfoTip";

interface CustomColorPickerProps {
  onAdd: (value: string, name: string) => void;
}

const PALETTE: { value: string; name: string }[] = [
  { value: "#101013", name: "Charcoal" },
  { value: "#101a3d", name: "Midnight Navy" },
  { value: "#1b1733", name: "Deep Indigo" },
  { value: "#2a2118", name: "Espresso" },
  { value: "#0f2027", name: "Pine" },
  { value: "#16243f", name: "Royal Blue" },
  { value: "#241f2e", name: "Plum" },
  { value: "#3a2f1a", name: "Bronze" },
  { value: "#7a1f5c", name: "Berry" },
  { value: "#c2410c", name: "Burnt Orange" },
  { value: "#eab308", name: "Amber" },
  { value: "#0d3b2e", name: "Emerald" },
  { value: "#3b0d1f", name: "Wine" },
  { value: "#1e3a8a", name: "Sapphire" },
  { value: "#4c1d95", name: "Violet" },
  { value: "#f5ecd7", name: "Parchment" },
];

const captionClassName =
  "mt-0 mb-1.75 text-[10.5px] font-bold tracking-[0.5px] text-subtle-foreground uppercase";

export const CustomColorPicker = ({ onAdd }: CustomColorPickerProps) => {
  const [color, setColor] = useState("#1b1733");
  const [css, setCss] = useState("");
  const [label, setLabel] = useState("");

  const trimmed = label.trim();
  const addColor = () => {
    if (!trimmed) return;
    onAdd(color, trimmed);
  };
  const addCss = () => {
    const value = css.trim();
    if (!value || !trimmed) return;
    onAdd(value, trimmed);
    setCss("");
  };

  return (
    <div className="mb-3 rounded-[11px] border border-border bg-secondary p-3">
      <p className={captionClassName}>Presets</p>
      <div className="mb-3.5 grid grid-cols-8 gap-1.5">
        {PALETTE.map((swatch) => (
          <button
            key={swatch.value}
            title={swatch.name}
            onClick={() => onAdd(swatch.value, swatch.name)}
            style={{ background: swatch.value }}
            className="aspect-square rounded-[7px] border border-border"
          />
        ))}
      </div>

      <p className={`${captionClassName} flex items-center gap-1`}>
        Add custom (label required)
        <InfoTip title="Custom backgrounds">
          Accepts any CSS background: hex, rgb or rgba, hsl, or a gradient.
          Presets already include a name.
        </InfoTip>
      </p>
      <Input
        value={label}
        placeholder="Label (e.g. Soft Cream)"
        onChange={(event) => setLabel(event.target.value)}
      />

      <div className="my-2.5 flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="h-9.5 w-10.5 cursor-pointer rounded-[9px] border border-border bg-transparent"
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!trimmed}
          onClick={addColor}
        >
          <Plus size={14} />
          Add color
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          value={css}
          placeholder="#1b1733, rgba(20,20,40,1), linear-gradient(…)"
          onChange={(event) => setCss(event.target.value)}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!trimmed || !css.trim()}
          onClick={addCss}
        >
          <Check size={14} />
          Add
        </Button>
      </div>
    </div>
  );
};
