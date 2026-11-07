import { InfoTip } from "@/components/shared/InfoTip";
import { SectionTitle } from "@/components/shared/Field";
import { SwitchField } from "@/components/shared/SwitchField";
import { useUsageStatistics } from "../../hooks/useUsageStatistics";

export const PrivacySection = () => {
  const { isAvailable, isEnabled, setEnabled } = useUsageStatistics();
  if (!isAvailable) return null;

  return (
    <>
      <SectionTitle
        info={
          <InfoTip title="Usage statistics">
            GospelStudio counts visits and which features are used, such as
            opening the Studio or starting a presentation, with Plausible
            Analytics. It uses no cookies and never sends your songs, notes,
            Bible notes, pictures, videos or camera. Turn this off to stop
            counting on this device.
          </InfoTip>
        }
      >
        Privacy
      </SectionTitle>
      <div className="mb-1.5">
        <SwitchField
          label="Share anonymous usage statistics"
          checked={isEnabled}
          onChange={setEnabled}
        />
      </div>
    </>
  );
};
