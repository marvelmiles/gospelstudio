import {
  SiFacebook,
  SiInstagram,
  SiKick,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { BriefcaseBusiness, RadioTower } from "lucide-react";
import type { StreamPlatformId } from "../lib/streamPlatforms";

interface PlatformIconProps {
  platform: StreamPlatformId;
  size?: number;
  className?: string;
}

const BRAND_COLOR = "default";

export const PlatformIcon = ({
  platform,
  size = 18,
  className,
}: PlatformIconProps) => {
  const shared = { size, className, "aria-hidden": true } as const;
  switch (platform) {
    case "youtube":
      return <SiYoutube {...shared} color={BRAND_COLOR} />;
    case "facebook":
      return <SiFacebook {...shared} color={BRAND_COLOR} />;
    case "instagram":
      return <SiInstagram {...shared} color={BRAND_COLOR} />;
    case "tiktok":
      return <SiTiktok {...shared} />;
    case "x":
      return <SiX {...shared} />;
    case "twitch":
      return <SiTwitch {...shared} color={BRAND_COLOR} />;
    case "kick":
      return <SiKick {...shared} color={BRAND_COLOR} />;
    case "linkedin":
      return <BriefcaseBusiness {...shared} />;
    case "custom":
      return <RadioTower {...shared} />;
  }
};
