import { useValueChange } from "@/hooks/useValueChange";
import { useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Music } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Background } from "../../types";
import { useStore } from "../../store/useStore";
import { useAttention } from "../../hooks/useAttention";
import { parseOverlayTarget } from "../../lib/overlayTarget";
import { Modal } from "@/components/shared/Modal";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import type { SegmentedTab } from "@/components/shared/SegmentedTabs";
import { pillTabPanelProps } from "@/components/shared/tabPanel";
import type { AssetSection } from "./assetLibraryNavigation";
import { useReopenAssetLibraryOnArrival } from "./assetLibraryNavigation";
import { BackgroundsPanel } from "./BackgroundsPanel";
import { AudioPanel } from "./AudioPanel";

interface AssetSectionMeta {
  label: string;
  icon: LucideIcon;
  lockedTitle: string;
}

const SECTIONS: Record<AssetSection, AssetSectionMeta> = {
  backgrounds: {
    label: "Backgrounds",
    icon: ImageIcon,
    lockedTitle: "Background Cover Library",
  },
  audio: {
    label: "Audio",
    icon: Music,
    lockedTitle: "Audio Library",
  },
};

const TAB_PREFIX = "asset-library";

const backgroundMatches = (
  background: Background,
  itemId: string | null,
): boolean =>
  Boolean(itemId) &&
  [background.id, background.mediaId, background.blobId].includes(
    itemId ?? undefined,
  );

const isAssetSection = (value?: string): value is AssetSection =>
  value === "backgrounds" || value === "audio";

export const AssetsModal = () => {
  const overlay = useStore((s) => s.overlay);
  const overlayContext = useStore((s) => s.overlayContext);
  const locked = useStore((s) => s.overlaySectionLocked);
  const close = useStore((s) => s.closeOverlay);
  const backgrounds = useStore((s) => s.backgrounds);
  const audio = useStore((s) => s.audio);

  useReopenAssetLibraryOnArrival();

  const contentRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<AssetSection>("backgrounds");

  const target =
    overlay === "assets" ? parseOverlayTarget(overlayContext) : null;
  const targetItemId = target?.itemId ?? null;
  const targetSection = target?.section;
  const attentionTarget =
    targetSection === "audio"
      ? targetItemId
      : (backgrounds.find((bg) => backgroundMatches(bg, targetItemId))?.id ??
        targetItemId);
  const attentionId = useAttention(attentionTarget, contentRef);
  useValueChange(
    targetSection,
    (section) => {
      if (isAssetSection(section)) setTab(section);
    },
    { onMount: true },
  );

  const sectionLocked = locked && isAssetSection(targetSection);

  const tabs = useMemo<SegmentedTab<AssetSection>[]>(
    () => [
      {
        id: "backgrounds",
        label: SECTIONS.backgrounds.label,
        icon: SECTIONS.backgrounds.icon,
        count: backgrounds.length,
      },
      {
        id: "audio",
        label: SECTIONS.audio.label,
        icon: SECTIONS.audio.icon,
        count: audio.length,
      },
    ],
    [audio.length, backgrounds.length],
  );

  return (
    <Modal
      open={overlay === "assets"}
      onClose={close}
      title={sectionLocked ? SECTIONS[tab].lockedTitle : "Asset Library"}
      width={720}
    >
      <div ref={contentRef} className="flex flex-col gap-4.5">
        {!sectionLocked && (
          <SegmentedTabs<AssetSection>
            ariaLabel="Asset kinds"
            idPrefix={TAB_PREFIX}
            tabs={tabs}
            value={tab}
            onChange={setTab}
          />
        )}
        <div {...pillTabPanelProps(TAB_PREFIX, tab)}>
          {tab === "backgrounds" ? (
            <BackgroundsPanel
              attentionId={attentionId}
              targetItemId={attentionTarget}
            />
          ) : (
            <AudioPanel attentionId={attentionId} />
          )}
        </div>
      </div>
    </Modal>
  );
};
