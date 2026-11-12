import {
  BIBLE_ON_GRASS_IMAGE_ID,
  RAISED_HANDS_IMAGE_ID,
} from "../../../data/backgrounds";
import type { TextStyle } from "../../../types";
import type { LayerFrame, TextAppearance } from "../types/layer";
import type { SceneTemplate, TemplateContext } from "./sceneTemplates";
import { createLayer, placement } from "./layerDefaults";
import { fillOf } from "./layerFill";
import { JOHN_3_16, overlayPassage } from "./overlayPassage";
import {
  BLACK_BACKGROUND,
  camera,
  churchLogo,
  fadingLine,
  glow,
  icon,
  panel,
  stripe,
  words,
} from "./templateLayers";

const YELLOW = "#fed201";
const INK = "#0c1033";
const LIVE_RED = "#dd050e";

const SCRIPTURE_PANEL_PAINT =
  "linear-gradient(90deg, rgb(40 18 152 / 0.85) 0%, rgb(40 18 152 / 0) 17%, rgb(0 28 122 / 0) 82%, rgb(0 30 126 / 0.92) 100%), linear-gradient(180deg, #01062f 0%, #02072f 45%, #05114c 66%, rgb(5 17 76 / 0.5) 100%)";
const NAME_PANEL_PAINT =
  "linear-gradient(90deg, rgb(2 8 40 / 0) 50%, rgb(4 30 150 / 0.6) 100%), linear-gradient(180deg, #0a4a80 0%, #08305e 12%, #061a40 34%, #030b2a 60%, #020829 100%)";
const CAMERA_TAG_PAINT =
  "linear-gradient(90deg, #020835 0%, #020a40 35%, #02208f 75%, #0638b5 100%)";
const BAND_PAINT =
  "linear-gradient(180deg, rgb(42 85 240 / 0) 0%, #2a55f0 0.8%, #2a55f0 2%, #001774 3.7%, #000a47 7.3%, #01083e 17%, #020838 61%, #010739 100%)";
const CROWD_FADE_PAINT =
  "linear-gradient(90deg, #020a45 0%, rgb(2 10 69 / 0) 55%), linear-gradient(180deg, rgb(2 10 69 / 0.6) 0%, rgb(2 10 69 / 0) 30%), linear-gradient(rgb(30 60 220 / 0.3), rgb(30 60 220 / 0.3))";
const NOTICE_BAR_PAINT =
  "linear-gradient(180deg, #eef3ff 0%, #eef3ff 3.3%, rgb(238 243 255 / 0) 3.3%), linear-gradient(90deg, rgb(10 4 60 / 0) 55%, rgb(10 4 62 / 0.75) 100%), linear-gradient(180deg, #2a2496 3.3%, #0b0a4a 11.2%, #010532 22.4%, #010532 100%)";

const PASSAGE_STYLE: TextStyle = {
  fontFamily: "Roboto",
  fontWeight: 500,
  fontSize: 5.5,
  lineHeight: 1.28,
  letterSpacing: 0,
  color: "#ffffff",
  align: "center",
  verticalAlign: "middle",
  uppercase: false,
  textShadow: "0 1px 4px rgba(0, 0, 0, 0.35)",
};

const highlight = (content: string) => `[[color=${YELLOW}]]${content}[[/]]`;

const SEPARATOR = `    ${highlight("|")}    `;

const text = (
  name: string,
  content: string,
  frame: LayerFrame,
  look: Partial<TextAppearance>,
) =>
  words(name, content, {
    frame,
    text: { fontFamily: "Roboto", lineHeight: 1.15, padding: 0, ...look },
  });

const announcementBand = () => {
  const crowdFrame = { x: 1400, y: 734, width: 520, height: 240 };
  return [
    panel(
      "Announcement band",
      { x: 680, y: 728, width: 1240, height: 246 },
      BAND_PAINT,
    ),
    createLayer("image", {
      name: "Crowd",
      mediaId: RAISED_HANDS_IMAGE_ID,
      overrides: { fit: "cover" },
      opacity: 55,
      focusY: 40,
      ...placement(crowdFrame),
    }),
    panel("Crowd fade", crowdFrame, CROWD_FADE_PAINT),
  ];
};

const churchName = () => [
  churchLogo({ x: 48, y: 41, width: 163, height: 115 }),
  text(
    "Church name",
    "Your\nChurch",
    { x: 222, y: 40, width: 240, height: 108 },
    { fontFamily: "Poppins", fontSize: 40, fontWeight: 600, lineHeight: 0.9 },
  ),
  text(
    "Tagline",
    `Worship ${highlight("•")} Grow ${highlight("•")} Serve`,
    { x: 224, y: 126, width: 240, height: 40 },
    { fontFamily: "Poppins", fontSize: 15.3, fontWeight: 400 },
  ),
];

const liveBadge = () => [
  panel("Live badge", { x: 1701, y: 39, width: 168, height: 48 }, LIVE_RED, {
    radius: 24,
    shadow: glow("#ff1f2d", 14, 45),
  }),
  panel(
    "Live dot",
    { x: 1719, y: 42, width: 40, height: 40 },
    "radial-gradient(circle closest-side, #ffffff 55%, rgb(255 255 255 / 0) 60%)",
  ),
  text(
    "Live label",
    "LIVE",
    { x: 1768, y: 26, width: 110, height: 72 },
    { fontSize: 35, fontWeight: 700 },
  ),
  text(
    "Service name",
    "Sunday Service",
    { x: 1664, y: 78, width: 240, height: 50 },
    { fontSize: 24.3, fontWeight: 500, align: "center" },
  ),
];

const scripturePanel = () => {
  const passage = overlayPassage({ sample: JOHN_3_16, style: PASSAGE_STYLE });
  return [
    createLayer("image", {
      name: "Open Bible",
      mediaId: BIBLE_ON_GRASS_IMAGE_ID,
      overrides: { fit: "cover", grayscale: 100 },
      focusY: 60,
      corners: { topLeft: 0, topRight: 0, bottomRight: 21, bottomLeft: 21 },
      ...placement({ x: 1275, y: 480, width: 616, height: 161 }),
    }),
    panel(
      "Scripture panel",
      { x: 1275, y: 160, width: 616, height: 481 },
      SCRIPTURE_PANEL_PAINT,
      {
        radius: 21,
        fillOpacity: 96,
        border: {
          width: 3.4,
          color: "#7a80ff",
          gradient: { to: "#ffffff", angle: 180 },
        },
        shadow: glow("#5b6cff", 16, 55),
      },
    ),
    panel(
      "Title underline",
      { x: 1484, y: 246, width: 330, height: 40 },
      fadingLine(`${YELLOW} 72%`, "rgb(254 210 1 / 0)", 3),
    ),
    icon(
      "Bible",
      "book",
      { x: 1349, y: 179, width: 104, height: 104 },
      { color: "#e9ad0c", filled: true, fill: "#fff6dc", strokeWidth: 1.2 },
    ),
    text(
      "Scripture title",
      "Today's Word",
      { x: 1482, y: 174, width: 380, height: 99 },
      { fontSize: 48, fontWeight: 700, color: YELLOW },
    ),
    createLayer("bible", {
      name: passage.title,
      passage,
      fill: fillOf("none"),
      ...placement({ x: 1253, y: 240, width: 658, height: 370 }),
    }),
  ];
};

const nameTag = () => [
  panel(
    "Name panel",
    { x: 71, y: 543, width: 468, height: 85 },
    NAME_PANEL_PAINT,
    {
      fillOpacity: 97,
      corners: { topLeft: 4, topRight: 11, bottomRight: 11, bottomLeft: 4 },
    },
  ),
  panel(
    "Name accent",
    { x: 51, y: 542, width: 40, height: 86 },
    stripe(YELLOW, 15),
    { rotation: 14.5 },
  ),
  text(
    "Preacher name",
    "*Preacher Name*",
    { x: 119, y: 530, width: 420, height: 77 },
    { fontSize: 37.4, fontWeight: 700 },
  ),
  text(
    "Preacher title",
    "*Lead Pastor*",
    { x: 118, y: 580, width: 420, height: 49 },
    { fontSize: 23.9, fontWeight: 500, color: YELLOW },
  ),
];

const secondCamera = (context: TemplateContext) => [
  camera(
    context,
    { x: 34, y: 658, width: 644, height: 296 },
    {
      name: "Second camera",
      keepAspect: false,
      radius: 15,
      border: { width: 3.4, color: "#f4f2ff", gradient: null },
      shadow: glow("#8ea2ff", 12, 35),
    },
  ),
  panel(
    "Camera tag",
    { x: 54, y: 668, width: 264, height: 40 },
    CAMERA_TAG_PAINT,
    { radius: 9 },
  ),
  icon(
    "Camera icon",
    "camera",
    { x: 59, y: 668, width: 40, height: 40 },
    { filled: true },
  ),
  text(
    "Camera label",
    "CONGREGATION CAM",
    { x: 105, y: 664, width: 250, height: 47 },
    { fontFamily: "Roboto Condensed", fontSize: 23, fontWeight: 700 },
  ),
];

const announcement = () => [
  panel(
    "Announcement tag",
    { x: 896, y: 696, width: 417, height: 70 },
    YELLOW,
    { radius: 35, shadow: glow(YELLOW, 20, 45) },
  ),
  icon(
    "Megaphone",
    "megaphone",
    { x: 920, y: 698, width: 64, height: 64 },
    { color: "#111111", strokeWidth: 2.4 },
  ),
  text(
    "Announcement label",
    "ANNOUNCEMENT",
    { x: 998, y: 695, width: 320, height: 71 },
    { fontSize: 34.5, fontWeight: 700, color: "#111111" },
  ),
  text(
    "Announcement",
    `Join us for our **Midweek Service**\nthis ${highlight("**Wednesday**")} at ${highlight("**6:30 PM**")}.`,
    { x: 887, y: 767, width: 760, height: 128 },
    { fontSize: 40.2, fontWeight: 500, align: "center", lineHeight: 1.14 },
  ),
  panel(
    "Left line",
    { x: 1006, y: 897, width: 70, height: 40 },
    fadingLine("rgb(255 255 255 / 0)", "#ffffff", 2),
  ),
  panel(
    "Right line",
    { x: 1463, y: 897, width: 70, height: 40 },
    fadingLine("#ffffff", "rgb(255 255 255 / 0)", 2),
  ),
  text(
    "Closing line",
    "*Come and be blessed!*",
    { x: 1063, y: 883, width: 420, height: 73 },
    { fontSize: 35.6, fontWeight: 400, align: "center" },
  ),
];

const noticeBar = () => [
  panel(
    "Notice bar",
    { x: 0, y: 973, width: 1920, height: 107 },
    NOTICE_BAR_PAINT,
    { shadow: glow("#3d63ff", 12, 75) },
  ),
  createLayer("shape", {
    name: "Motto tag",
    shape: "slantLeft",
    fill: YELLOW,
    ...placement({ x: 1679, y: 970, width: 241, height: 110 }),
  }),
  panel(
    "Motto swoosh",
    { x: 1758, y: 1031, width: 119, height: 40 },
    fadingLine("rgb(12 16 51 / 0.35)", `${INK} 35%`, 3),
    { rotation: -4 },
  ),
  icon(
    "Bell",
    "bell",
    { x: 28, y: 999, width: 40, height: 40 },
    { filled: true },
  ),
  text(
    "Notices",
    [
      highlight("**ANNOUNCEMENTS:**"),
      "Welcome to our church family.",
      "Follow us: @yourchurch",
      "Visit: yourchurch.org",
    ].join(SEPARATOR),
    { x: 79, y: 988, width: 1590, height: 57 },
    { fontSize: 27.6, fontWeight: 400 },
  ),
  text(
    "Motto",
    "*Together*\n*in Faith*",
    { x: 1759, y: 966, width: 160, height: 85 },
    { fontSize: 30.2, fontWeight: 700, color: INK, lineHeight: 0.95 },
  ),
];

export const SERVICE_OVERVIEW_TEMPLATE: SceneTemplate = {
  id: "broadcast-overview",
  name: "Service at a glance",
  description:
    "The preacher on camera with the passage, their name, a second camera, an announcement and a notice bar.",
  group: "broadcast",
  background: BLACK_BACKGROUND,
  build: (context) => [
    camera(context),
    ...announcementBand(),
    ...churchName(),
    ...liveBadge(),
    ...scripturePanel(),
    ...nameTag(),
    ...secondCamera(context),
    ...announcement(),
    ...noticeBar(),
  ],
};
