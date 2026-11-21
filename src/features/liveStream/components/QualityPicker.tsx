import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LIVE_QUALITY_LIST,
  liveQualityIdSchema,
  type LiveQualityId,
} from "../lib/liveQuality";

interface QualityPickerProps {
  value: LiveQualityId;
  disabled: boolean;
  onChange: (quality: LiveQualityId) => void;
}

export const QualityPicker = ({
  value,
  disabled,
  onChange,
}: QualityPickerProps) => (
  <ToggleGroup
    type="single"
    aria-label="Picture quality"
    value={value}
    disabled={disabled}
    onValueChange={(next) => {
      const parsed = liveQualityIdSchema.safeParse(next);
      if (parsed.success) onChange(parsed.data);
    }}
    spacing={1}
    className="grid w-full gap-2 sm:grid-cols-3"
  >
    {LIVE_QUALITY_LIST.map((profile) => {
      return (
        <ToggleGroupItem
          key={profile.id}
          value={profile.id}
          aria-label={profile.label}
          className="h-auto flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left whitespace-normal"
        >
          <span className="text-[13px] font-semibold text-foreground">
            {profile.label}
          </span>
          <span className="text-[12px] leading-snug font-normal text-muted-foreground">
            {profile.description}
          </span>
          <span className="text-[11.5px] font-normal text-subtle-foreground">
            Upload of about {profile.recommendedUploadMbps} Mbps
          </span>
        </ToggleGroupItem>
      );
    })}
  </ToggleGroup>
);
