import type { Background, MediaItem } from "../types";

const IMAGE_ASSETS_PATH = "/assets/images";
const VIDEO_ASSETS_PATH = "/assets/videos";
const BUILT_IN_ASSETS_DATE = "2026-10-29T00:00:00.000Z";

interface BuiltInAsset {
  file: string;
  name: string;
  category: string;
}

const IMAGE_ASSETS: BuiltInAsset[] = [
  { file: "sermon", name: "Sermon", category: "Service" },
  { file: "bible-study", name: "Bible Study", category: "Service" },
  { file: "testimony-time", name: "Testimony Time", category: "Service" },
  { file: "offering", name: "Offering", category: "Service" },
  { file: "announcement", name: "Announcement", category: "Service" },
  { file: "jesus", name: "Jesus", category: "Worship" },
  { file: "raised-hands", name: "Raised Hands", category: "Worship" },
  { file: "hand-on-bible", name: "Hand on Bible", category: "Scripture" },
  { file: "bible-on-grass", name: "Bible on Grass", category: "Scripture" },
  { file: "bible-on-quilt", name: "Bible on Quilt", category: "Scripture" },
  {
    file: "bible-thorn-branch",
    name: "Bible and Thorn Branch",
    category: "Scripture",
  },
  { file: "coins-basket", name: "Coins Basket", category: "Giving" },
  { file: "offering-basket", name: "Offering Basket", category: "Giving" },
  { file: "rain-ripples", name: "Rain Ripples", category: "Texture" },
  { file: "green-smoke", name: "Green Smoke", category: "Texture" },
  { file: "black-sand", name: "Black Sand", category: "Texture" },
];

const VIDEO_ASSETS: BuiltInAsset[] = [
  { file: "light-burst-blue", name: "Light Burst Blue", category: "Motion" },
  {
    file: "particle-wave-blue",
    name: "Particle Wave Blue",
    category: "Motion",
  },
  { file: "warp-streaks-red", name: "Warp Streaks Red", category: "Motion" },
];

const clipIdOf = (file: string): string => `clip-${file}`;

const imageBackground = ({
  file,
  name,
  category,
}: BuiltInAsset): Background => ({
  id: `bg-image-${file}`,
  name,
  category,
  type: "image",
  builtIn: true,
  src: `${IMAGE_ASSETS_PATH}/${file}.jpg`,
});

const videoBackground = ({
  file,
  name,
  category,
}: BuiltInAsset): Background => ({
  id: `bg-video-${file}`,
  name,
  category,
  type: "video",
  builtIn: true,
  mediaId: clipIdOf(file),
});

const builtInClip = ({ file, name }: BuiltInAsset): MediaItem => ({
  id: clipIdOf(file),
  kind: "video",
  name,
  mimeType: "video/mp4",
  size: 0,
  src: `${VIDEO_ASSETS_PATH}/${file}.mp4`,
  builtIn: true,
  createdAt: BUILT_IN_ASSETS_DATE,
  updatedAt: BUILT_IN_ASSETS_DATE,
});

export const BUILT_IN_CLIPS: MediaItem[] = VIDEO_ASSETS.map(builtInClip);

const COLOR_BACKGROUNDS: Background[] = [
  {
    id: "bg-dawn",
    name: "Sunrise",
    category: "Worship",
    type: "gradient",
    builtIn: true,
    css: "linear-gradient(160deg,#1b1733 0%,#3a2a4d 35%,#9a5b54 70%,#e8a765 100%)",
  },
  {
    id: "bg-heaven",
    name: "Heaven",
    category: "Worship",
    type: "gradient",
    builtIn: true,
    css: "linear-gradient(180deg,#16243f 0%,#2f4d7a 52%,#4f74a8 100%)",
  },
  {
    id: "bg-rays",
    name: "Light Rays",
    category: "Worship",
    type: "gradient",
    builtIn: true,
    css: "radial-gradient(circle at 50% -10%,#4a3f63 0%,#1a1626 55%,#0d0b14 100%)",
  },
  {
    id: "bg-mountain",
    name: "Mountains",
    category: "Worship",
    type: "gradient",
    builtIn: true,
    css: "linear-gradient(180deg,#0f131a 0%,#27313f 60%,#3c4a5e 100%)",
  },
  {
    id: "bg-cross",
    name: "Cross",
    category: "Worship",
    type: "gradient",
    builtIn: true,
    css: "radial-gradient(circle at 50% 42%,#241f2e 0%,#0c0a10 78%)",
  },
  {
    id: "bg-celebration",
    name: "Celebration",
    category: "Praise",
    type: "gradient",
    builtIn: true,
    css: "linear-gradient(135deg,#7a1f5c 0%,#c2410c 55%,#eab308 100%)",
  },
  {
    id: "bg-abstract",
    name: "Abstract Light",
    category: "Praise",
    type: "gradient",
    builtIn: true,
    css: "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
  },
  {
    id: "bg-stage",
    name: "Church Stage",
    category: "Praise",
    type: "gradient",
    builtIn: true,
    css: "radial-gradient(ellipse at 50% 120%,#3a2f1a 0%,#0b0a08 70%)",
  },
  {
    id: "bg-parchment",
    name: "Open Bible",
    category: "Hymns",
    type: "gradient",
    builtIn: true,
    css: "linear-gradient(180deg,#f5ecd7 0%,#e7d6b3 100%)",
    light: true,
  },
  {
    id: "bg-vintage",
    name: "Vintage Church",
    category: "Hymns",
    type: "gradient",
    builtIn: true,
    css: "linear-gradient(160deg,#d9c4a0 0%,#a98c63 100%)",
    light: true,
  },
  {
    id: "bg-deep",
    name: "Deep Black",
    category: "Hymns",
    type: "solid",
    builtIn: true,
    color: "#0a0a0c",
  },
  {
    id: "bg-royal",
    name: "Royal Blue",
    category: "Hymns",
    type: "solid",
    builtIn: true,
    color: "#101a3d",
  },
];

export const BACKGROUNDS: Background[] = [
  ...COLOR_BACKGROUNDS,
  ...IMAGE_ASSETS.map(imageBackground),
  ...VIDEO_ASSETS.map(videoBackground),
];
