import {
  BIBLE_ON_GRASS_IMAGE_ID,
  HAND_ON_BIBLE_IMAGE_ID,
  RAISED_HANDS_IMAGE_ID,
} from "../../../data/backgrounds";
import type { SceneTemplate } from "./sceneTemplates";
import { createLayer, placement } from "./layerDefaults";
import { colorFill, fillOf } from "./layerFill";
import {
  BLACK_BACKGROUND,
  BOTTOM_SHADE,
  DARK_BACKGROUND,
  GOLD_FRAME,
  LIFTED,
  background,
  camera,
  churchLogo,
  coverImage,
  dateTag,
  panel,
  tag,
  wash,
  words,
} from "./templateLayers";

const BOTTOM_HALF = { x: 0, y: 540, width: 1920, height: 540 };

export const BROADCAST_TEMPLATES: SceneTemplate[] = [
  {
    id: "broadcast-scripture",
    name: "Framed scripture",
    description:
      "The preacher and the passage in gold frames, with logos and a date tag.",
    group: "broadcast",
    background: DARK_BACKGROUND,
    build: (context) => [
      background(context),
      camera(
        context,
        { x: 64, y: 230, width: 500, height: 680 },
        {
          name: "Camera (framed)",
          keepAspect: false,
          radius: 28,
          border: { ...GOLD_FRAME },
          shadow: { ...LIFTED },
        },
      ),
      createLayer("bible", {
        radius: 28,
        fill: colorFill("linear-gradient(160deg, #2e1f73, #120b36)", 96),
        border: { ...GOLD_FRAME },
        shadow: { ...LIFTED },
        ...placement({ x: 604, y: 230, width: 1252, height: 680 }),
      }),
      createLayer("image", {
        name: "Series logo",
        ...placement({ x: 820, y: 28, width: 280, height: 170 }),
      }),
      churchLogo(),
      ...dateTag(64, 932),
    ],
  },
  {
    id: "broadcast-camera",
    name: "Branded camera",
    description: "The camera fills the screen, with your logo and a date tag.",
    group: "broadcast",
    background: BLACK_BACKGROUND,
    build: (context) => [camera(context), churchLogo(), ...dateTag()],
  },
  {
    id: "broadcast-lyrics",
    name: "Lyrics over camera",
    description:
      "Song words at the bottom of the camera picture, over a soft shade.",
    group: "broadcast",
    background: BLACK_BACKGROUND,
    build: (context) => [
      camera(context),
      wash("Bottom shade", BOTTOM_SHADE, BOTTOM_HALF),
      createLayer("manuscript", {
        fill: fillOf("none"),
        ...placement({ x: 460, y: 540, width: 1000, height: 540 }),
      }),
      churchLogo(),
      ...dateTag(),
    ],
  },
  {
    id: "broadcast-caption",
    name: "Camera with big caption",
    description:
      "One bold line over the camera, for moments like Congratulations.",
    group: "broadcast",
    background: BLACK_BACKGROUND,
    build: (context) => [
      camera(context),
      wash("Bottom shade", BOTTOM_SHADE, BOTTOM_HALF),
      words("Caption", "Congratulations!", {
        frame: { x: 420, y: 860, width: 1080, height: 150 },
        text: {
          fontFamily: "Montserrat",
          fontSize: 84,
          fontWeight: 800,
          align: "center",
          uppercase: true,
          shadow: true,
          padding: 16,
        },
      }),
      churchLogo(),
      ...dateTag(),
    ],
  },
  {
    id: "broadcast-response",
    name: "Response with QR code",
    description:
      "A side panel, the camera, a bold heading, a link bar and a QR code.",
    group: "broadcast",
    background: DARK_BACKGROUND,
    build: (context) => [
      wash(
        "Backdrop",
        "radial-gradient(circle at 70% 30%, #1e3a8a 0%, #0b1230 55%, #05081a 100%)",
      ),
      panel(
        "Side panel",
        { x: 28, y: 28, width: 300, height: 1024 },
        "linear-gradient(180deg, #1d4ed8, #172554 70%, #0b1230)",
        {
          radius: 20,
          border: {
            width: 6,
            color: "#fbbf24",
            gradient: { to: "#f97316", angle: 180 },
          },
        },
      ),
      churchLogo({ x: 58, y: 80, width: 240, height: 200 }),
      tag("Side tag", "Sunday service", {
        frame: { x: 58, y: 760, width: 240, height: 70 },
        paint: "#22d3ee",
        color: "#0b1230",
        fontSize: 26,
      }),
      camera(
        context,
        { x: 360, y: 28, width: 1532, height: 690 },
        {
          keepAspect: false,
          radius: 20,
          border: { width: 6, color: "#e2e8f0", gradient: null },
          shadow: { ...LIFTED },
        },
      ),
      tag("Heading tag", "New believers", {
        frame: { x: 400, y: 772, width: 520, height: 84 },
        paint: "linear-gradient(135deg, #ef4444, #991b1b)",
        color: "#ffffff",
        fontSize: 46,
      }),
      tag("Link", "yourchurch.org/next-steps", {
        frame: { x: 400, y: 866, width: 1000, height: 104 },
        paint: "linear-gradient(90deg, #fef08a, #facc15)",
        color: "#0f172a",
        fontSize: 52,
        uppercase: false,
      }),
      createLayer("qr", {
        caption: "Scan to connect",
        radius: 20,
        border: { width: 10, color: "#22d3ee", gradient: null },
        ...placement({ x: 1480, y: 680, width: 320, height: 380 }),
      }),
    ],
  },
  {
    id: "broadcast-notice",
    name: "Notice band",
    description:
      "A labelled band of small print across the bottom of the camera.",
    group: "broadcast",
    background: BLACK_BACKGROUND,
    build: (context) => [
      camera(context),
      churchLogo(),
      tag("Notice tag", "Disclaimer", {
        frame: { x: 58, y: 740, width: 300, height: 64 },
        paint: "linear-gradient(135deg, #22d3ee, #0891b2)",
        color: "#0b1230",
        fontSize: 34,
      }),
      words(
        "Notice",
        "Type the notice here. Keep it short so people can read it before it leaves the screen.",
        {
          frame: { x: 58, y: 804, width: 1804, height: 236 },
          paint:
            "linear-gradient(180deg, rgb(15 23 72 / 0.94), rgb(30 64 175 / 0.9))",
          radius: 10,
          text: {
            fontFamily: "Poppins",
            fontSize: 34,
            fontWeight: 500,
            align: "justify",
            lineHeight: 1.45,
            padding: 28,
          },
        },
      ),
    ],
  },
  {
    id: "broadcast-welcome",
    name: "Welcome slide",
    description: "A photo with a colour wash, a welcome line and your name.",
    group: "broadcast",
    background: DARK_BACKGROUND,
    build: () => [
      coverImage("Photo", RAISED_HANDS_IMAGE_ID),
      wash(
        "Colour wash",
        "linear-gradient(180deg, rgb(30 27 75 / 0.35), rgb(15 12 41 / 0.85))",
      ),
      words("Welcome line", "Welcome to", {
        frame: { x: 360, y: 300, width: 1200, height: 150 },
        text: {
          fontFamily: "Playfair Display",
          fontSize: 120,
          fontWeight: 600,
          align: "center",
          shadow: true,
          padding: 8,
        },
      }),
      words("Church name", "Your church name", {
        frame: { x: 160, y: 450, width: 1600, height: 200 },
        text: {
          fontFamily: "Montserrat",
          fontSize: 120,
          fontWeight: 900,
          align: "center",
          uppercase: true,
          lineHeight: 1.05,
          shadow: true,
          padding: 8,
        },
      }),
      words("Website", "www.yourchurch.org", {
        frame: { x: 560, y: 900, width: 800, height: 80 },
        text: {
          fontFamily: "Poppins",
          fontSize: 40,
          fontWeight: 500,
          color: "#e0e7ff",
          align: "center",
          shadow: true,
          padding: 8,
        },
      }),
    ],
  },
  {
    id: "broadcast-ministry",
    name: "Ministry spotlight",
    description:
      "A big title, a gold subtitle and contact details over a photo.",
    group: "broadcast",
    background: DARK_BACKGROUND,
    build: () => [
      coverImage("Photo", BIBLE_ON_GRASS_IMAGE_ID),
      wash(
        "Colour wash",
        "linear-gradient(180deg, rgb(5 46 22 / 0.55), rgb(2 20 10 / 0.88))",
      ),
      words("Title", "Home fellowship", {
        frame: { x: 160, y: 260, width: 1600, height: 190 },
        text: {
          fontFamily: "Montserrat",
          fontSize: 128,
          fontWeight: 900,
          align: "center",
          uppercase: true,
          lineHeight: 1.05,
          shadow: true,
          padding: 8,
        },
      }),
      words("Subtitle", "Church in the home", {
        frame: { x: 360, y: 450, width: 1200, height: 100 },
        text: {
          fontFamily: "Poppins",
          fontSize: 64,
          fontWeight: 600,
          color: "#fbbf24",
          align: "center",
          shadow: true,
          padding: 8,
        },
      }),
      words(
        "Details",
        "For locations, visit yourchurch.org\nor email hello@yourchurch.org",
        {
          frame: { x: 360, y: 680, width: 1200, height: 200 },
          text: {
            fontFamily: "Poppins",
            fontSize: 48,
            fontWeight: 600,
            align: "center",
            lineHeight: 1.35,
            shadow: true,
            padding: 8,
          },
        },
      ),
    ],
  },
  {
    id: "broadcast-event",
    name: "Event promo",
    description: "A gold headline, details and a time beside a photo.",
    group: "broadcast",
    background: DARK_BACKGROUND,
    build: () => [
      coverImage("Photo", HAND_ON_BIBLE_IMAGE_ID),
      wash(
        "Side shade",
        "linear-gradient(90deg, rgb(0 0 0 / 0.88) 0%, rgb(0 0 0 / 0.55) 45%, rgb(0 0 0 / 0) 75%)",
      ),
      words("Headline", "New members class", {
        frame: { x: 110, y: 230, width: 900, height: 300 },
        text: {
          fontFamily: "Montserrat",
          fontSize: 110,
          fontWeight: 800,
          color: "linear-gradient(180deg, #fde68a, #d97706)",
          align: "left",
          uppercase: true,
          lineHeight: 1.05,
          shadow: true,
          padding: 8,
        },
      }),
      words("Details", "For everyone joining the family", {
        frame: { x: 110, y: 540, width: 760, height: 150 },
        text: {
          fontFamily: "Poppins",
          fontSize: 54,
          fontWeight: 600,
          align: "left",
          lineHeight: 1.25,
          shadow: true,
          padding: 8,
        },
      }),
      words("Time", "Sundays  |  7:45 AM", {
        frame: { x: 110, y: 740, width: 700, height: 100 },
        text: {
          fontFamily: "Poppins",
          fontSize: 60,
          fontWeight: 700,
          align: "left",
          shadow: true,
          padding: 8,
        },
      }),
    ],
  },
];
