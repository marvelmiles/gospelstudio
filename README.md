# GospelStudio

**Church media application that runs in your web browser and works offline.**

GospelStudio is a church media application for displaying lyrics, hymns, Bible verses, sermon notes, pictures, and videos on projectors or TVs. Its Studio puts a camera, Bible verses, manuscripts, images and subtitles on the big screen together, and any phone, tablet or laptop can join it as a camera. It works offline, stores content on your device, and requires no installation.

**Try it here: [gospelstudio.app](https://gospelstudio.app/)**

## Why I built it

I started GospelStudio because of a real problem at my church.

I was handling the media, and the presentation software we used kept freezing in the middle of services. Hymns, pictures, and videos would stutter just when people needed them most. On top of that, most software designed for this purpose requires a paid licence, installation, or an internet connection. And the Wi-Fi in my church wasn't something I could rely on when the first song started.

So I made the one I wanted. Simple to set up and easy for any volunteer to use. It runs in the browser, stores everything on the device, works offline, and requires no installation.

Everything else in the app comes from how our church actually works:

- **We can't count on the internet.** Everything is saved on the device, and devices can connect by scanning a QR code when there is no network.
- **Our things stay with us.** Our songs, notes and photos belong to the church, so nothing is uploaded. Sharing goes straight from one device to another.
- **The person running slides is a volunteer.** Pasting the lyrics is all it takes to add a song, and jumping to Verse 2 or the chorus takes one key press.
- **We use what we already have.** A laptop, a projector and someone's phone are enough for a full camera setup.

## What's inside

GospelStudio is a single page React and TypeScript app that works like a desktop presentation program:

- **The library** keeps your manuscripts (songs, hymns and sermons), an offline Bible, images, videos, sounds, backgrounds and themes.
- **The editor** lets you type straight on the slide, so what you see is what the room will see.
- **Presentation mode** fills the projector, while your laptop shows your notes, the next slide and a timer.
- **The Studio** builds the projector screen from layers: a webcam or phone camera, Bible verses, manuscripts, images, videos, subtitles, a speaker's name and more, prepared in a preview and sent live with one button.
- **Live streaming** sends the Studio's live screen to YouTube, Facebook and other platforms at the same time, so people anywhere can watch the service.
- **Share camera** turns a phone, tablet or laptop into a camera for the Studio, over WiFi or with a code.
- **Share** copies your library and studio productions to a nearby device, over WiFi or with a code.
- **Accounts and sync** keep a church's library in one account and sync it between devices in the background, while everything still works offline.

It builds to plain static files, can be installed as an app (PWA), and updates itself in the background.

## Features

**Songs, slides and editing**

- **Paste and it becomes slides.** Tags like `[verse]` and `[chorus]` are recognised and numbered, and long parts are split across slides so the text stays big enough to read.
- **Manuscript library.** Lyrics, hymns, sermons and other decks, sorted into collections. Search by title, author or words.
- **Pin your favourites.** Keep up to five items at the top of each library.
- **Offline Bible.** The King James Version and the American Standard Version are built in. Read, search, save and present any passage with no internet, or have it read aloud. Verse numbers can be written inline or as small raised numbers.
- **Type on the slide itself.** The slide in the editor is where you type, so there is no separate text box to keep in sync.
- **Slide styling.** Font, size, weight, color, alignment, spacing and shadow (soft glow, sharp drop or outline), for one slide or the whole manuscript. Text position puts the words at the top, middle or bottom of the slide, so lyrics can sit along the bottom of a camera shot.
- **Pictures, clips and text boxes.** Drop them anywhere on a slide, then drag, resize and stack them. A selected clip shows its own player controls.
- **Text formatting.** Bold, italic, underline, strikethrough and highlight. The formatting is stored as plain text, so it survives copy and paste.
- **Backgrounds and sounds.** Pick one for a single slide or for the whole manuscript. Choosing None means silence, not the theme's sound.
- **Edit an asset for one place only.** The pencil opens a picture, clip or sound in its editor, and your changes apply to that one use only.
- **Built-in backgrounds.** Pictures, moving video backgrounds, colors and gradients come ready to use. You can edit them, but not delete them.
- **Images and videos.** Upload once and use them anywhere: as a background, on a slide, in a Studio scene, or sent to another device.
- **Themes.** A theme sets the whole look of a manuscript. Use the built-in ones or make your own in the theme editor.

**Accounts and sync**

- **Optional church accounts.** Sign up with a church or ministry name, an email and a password. Nothing changes for people who never sign in.
- **Offline first, always.** Every change is saved on the device first. Signed in or not, online or not, the app keeps working.
- **You decide when offline work joins your account.** After signing in, a dialog asks before anything made on this device is uploaded. Choose Sync now, or Not now and turn it on later from Account.
- **Sync in the background.** Manuscripts, Bible passages, images, videos, sounds, backgrounds, themes, settings and Studio productions sync while you keep working. The header shows whether you are up to date, syncing, paused or offline.
- **Your account, your devices.** Rename the church or ministry, change the email or password, see every signed-in device and sign any of them out, check cloud storage, or delete the account. Forgot password sends a reset link by email.

**Presenting**

- **Presentation mode.** Full screen, with a presenter bar that shows your notes, the next slide, a timer and a slide counter. You can pause, and background music can loop while you present.
- **Slide animations.** Fade, Cross Fade, Dissolve, Zoom and Slide in four directions. Set one for the whole app, a theme, a manuscript or a single slide, and preview it in the editor.
- **Auto-play.** Slides move forward by themselves after the number of seconds you choose, and can loop back to the start for announcement slideshows.
- **Go live or preview.** Go live sends the slides to the audience screen. Preview here shows them only on your own screen.
- **Go live fills the projector.** With a screen connected over HDMI, the audience window opens already full screen on it, using the browser's Window Management API.
- **Keyboard control.** Hold `Ctrl` and type a number to jump to a verse, or press `Ctrl+C` for the chorus. The slide list shows each shortcut before you start.

**Studio**

- **One screen built from layers.** Put a camera, a Bible passage, a manuscript, text, images, videos, announcements, a speaker's name, a QR code, shapes and backgrounds on the projector together. Drag and resize anything, snap it to the edges and centre, and change it from the panel on the left.
- **Text presets and size presets.** Text can be normal, a heading across the top or a subtitle along the bottom. Images can fill the screen, sit large or medium in the middle, or shrink to a logo in the corner. Ten shapes, from rectangles and circles to stars, arrows, a cross and a slanted tag, sit under Shapes.
- **Borders, shadows and gradients.** Any item can have a border in one colour or blended between two, and a soft shadow or a glow. Shapes and the background behind text can blend between two colours too, and text can be justified across its box.
- **Corners and exact values.** Round all four corners together or each corner on its own, for tags and badges. Colour boxes take any CSS colour (hex, rgb, hsl or a name), and backgrounds, borders and Studio text also take a CSS gradient. Every slider has a box beside it to type an exact value, and some, such as text size and border thickness, accept values past the end of the slider.
- **Content keeps its own look.** A manuscript, Bible passage, image or video arrives with the background, animations, auto-play and loop settings from its own page, and every slide enters and leaves with its own animation.
- **Edit content for one production.** The three-dot menu on anything in a scene has Open editor, which opens the manuscript, Bible, image or video editor on that production's own copy. The library stays as it was. Auto update (on by default) sends each change to the scene as you make it, or turn it off and press Update scene. Preview shows the edited version on your own screen first.
- **A PiP remote for each item.** Open PiP shows a small floating window for a manuscript, passage or video in a scene, with the slide's presenter notes, so you can step through slides with the keyboard from any page. Every item gets its own window, so a hymn, a sermon and a passage can be open together. It opens by itself when you open the editor of an item that is in the Preview or live, and it pauses and resumes auto-play.
- **Ready-made layouts.** Full-screen camera, camera with a Bible passage, camera with a manuscript, camera with a speaker's name, picture-in-picture, split screen, preacher with scripture and a subtitle, a welcome screen for new believers with a QR code, full-screen image, video or announcement, and a worship manuscript over a moving background. Save any scene as your own layout to reuse it.
- **Preview, then go live.** Prepare the next scene in the preview while everyone keeps watching the live screen. Point at Present and choose Preview to open the scene in a new tab exactly as GO LIVE will show it, with an Update screen button once you change something. GO LIVE changes over with a crossfade, a fade through black or a slide, and Cut changes straight away. Black screen fades everything out.
- **Change the live screen without starting again.** Step through manuscript and Bible slides, play or pause a video, and show or hide any layer straight from Live controls or the PiP window. The camera keeps running the whole time.
- **Cameras that stay on.** Choose a webcam or capture card on the computer, or connect a phone, tablet or laptop that has the Share camera page open. A camera is opened once and shared by every scene, so switching scenes never restarts it. A webcam reconnects by itself if it is unplugged, and a phone that sleeps picks up again when it wakes.
- **Record the service.** Record captures the projector screen (or any window or screen you pick) together with the sound of cameras on other devices. Pause and Resume as you go, with a timer that pauses too, and Stop saves the video to your downloads as MP4 where the browser supports it, otherwise WebM. Recordings are landscape 1080p HD (16:9) for TVs and monitors and stay small, about 16 MB a minute at most.
- **Hear the other device.** When a phone shares its microphone, its sound plays from the computer running the Studio whenever that camera is on the live screen.
- **A clean projector screen.** Point at Present and choose Go live to open a window on the projector with only the picture, filling the whole screen, with no buttons or outlines. It keeps up when the studio reloads, and the test picture in its menu shows a test card with corner marks before the service.
- **Undo, redo and autosave.** Every change can be undone, and productions save on this device as you work.

**Live streaming**

- **Every major platform at once.** Stream the live screen to YouTube, Facebook, Instagram, TikTok, X, Twitch, LinkedIn, Kick or any RTMP service. The picture is encoded once and sent to all of them together, and a platform can be switched on or off while live without stopping the others.
- **Made for weak internet.** The stream adapts to the connection: when it weakens, the picture is lowered for a moment instead of freezing, and lost sound packets are hidden. Choose Full HD 1080p, HD 720p or Data saver 480p as the ceiling, and watch the connection strength in the header while live.
- **Clear sound.** Sound goes out at 128 kbps stereo, tuned for music. Plug the church sound desk in through a USB audio interface and pick it as the sound input. Polish cuts rumble and evens out loud and quiet parts, and AI noise cancellation (RNNoise, running in the browser) removes fans, traffic and chatter from speech.
- **The same screen the room sees.** Stream captures the projector screen together with the sound of cameras on other devices, and shares one window pick with Record.
- **Keys stay with you.** Stream keys are saved only on the device and are redacted from everything the server returns. See [`src/features/liveStream/LIVE_STREAMING.md`](src/features/liveStream/LIVE_STREAMING.md).

**Share camera**

- **One page for camera sharing.** Open it from the camera icon in the Studio header or from the menu, and press Start sharing. The QR code in the Studio's camera window is made for that Studio: scan it with a phone's camera and the phone opens Share camera and connects by itself. Started by hand, the device appears in the Studio.
- **Easy pairing.** On the same WiFi, the device shows up in the Studio's list and one tap connects it. With no internet, the devices scan each other's QR codes instead.
- **Codes a webcam can read.** The pairing code is squeezed into one small QR code, and the scanner looks for it across the whole camera view.
- **Keeps going when the phone sleeps.** A wake lock and a silent sound keep the page awake, and a dropped connection reconnects by itself.
- **Microphone and front or back camera.** Include audio shares the device's microphone, and Switch camera flips between lenses without reconnecting.

**Sharing and data**

- **Share.** Every device with the page open on the same WiFi can see the others. Pick who to send to, then pick what to send from each part of your library, studio productions included.
- **Everything an item needs goes with it.** A manuscript brings its background, sound, clips and theme, and a production brings the manuscripts, passages, pictures and videos its scenes use. The other device can accept or decline.
- **Works with no internet.** Devices that can't find each other pair with a QR code or a typed code, just like the cameras.
- **Watch your sends.** Each device shows its own progress and a stop button, and a transfer keeps going if the phone goes to sleep.
- **Backup.** Export your whole library, pictures, videos and studio productions included, into one `.zip` file and bring it back later. The file is checked before anything is imported.
- **Install it and use it offline.** The app is saved on your device, so it opens with no internet and tells you when a new version is ready.
- **Privacy-friendly usage statistics.** The live site counts visits and which features are used with Plausible Analytics: no cookies, no personal data, and never any of your songs, notes, pictures, videos or camera. Anyone can turn it off in Settings under Privacy. See [`src/features/analytics/ANALYTICS.md`](src/features/analytics/ANALYTICS.md).

### Keyboard shortcuts (presentation)

**Moving between slides**

| Key                                   | Action         |
| ------------------------------------- | -------------- |
| Right arrow / Space / Page Down / `L` | Next slide     |
| Left arrow / Page Up / `H`            | Previous slide |
| Home                                  | First slide    |
| End                                   | Last slide     |

**Jumping to a part of the song** _(only verses use numbers; every other part has its own letter)_

Hold `Ctrl`, type one or more numbers, then let go of `Ctrl` to jump to that verse. Verses are numbered in the order they appear in the slide list, and `[solo]` counts as a verse. Other parts are never numbered, so each one has its own letter instead.

| Keys                                | Action                             |
| ----------------------------------- | ---------------------------------- |
| Hold `Ctrl` + `1`, `2`… then let go | Jump to **Verse** N                |
| `Ctrl` + `C`                        | Jump to first **Chorus** slide     |
| `Ctrl` + `B`                        | Jump to first **Bridge** slide     |
| `Ctrl` + `I`                        | Jump to first **Intro** slide      |
| `Ctrl` + `O`                        | Jump to first **Outro** slide      |
| `Ctrl` + `P`                        | Jump to first **Pre-Chorus** slide |
| `Ctrl` + `R`                        | Jump to first **Refrain** slide    |
| `Ctrl` + `T`                        | Jump to first **Tag** slide        |

In the editor's slide list, the first slide of each verse shows a `^N` badge and every other part shows its letter, so you can see the shortcut before you present. Install the app (PWA) to keep the shortcuts that a browser tab would otherwise use for itself.

**Playback**

| Key | Action                              |
| --- | ----------------------------------- |
| `P` | Pause / resume                      |
| `R` | Read the Bible passage aloud / stop |
| Esc | Leave the presentation              |

When a clip is on screen, the playback keys control the clip: Space and `P` play and pause, the left and right arrows jump five seconds, and `M` mutes. When a slider is selected, it keeps the arrow and Page keys for itself.

**View**

| Key | Action                                                |
| --- | ----------------------------------------------------- |
| `F` | Full screen on or off                                 |
| `I` | Show or hide the presenter bar                        |
| `V` | Change how it fits the screen (normal / cover / fill) |
| `+` | Zoom in                                               |
| `-` | Zoom out                                              |
| `0` | Reset zoom                                            |

### Keyboard shortcuts (Studio)

| Key                  | Action                                           |
| -------------------- | ------------------------------------------------ |
| `Ctrl` + `Z`         | Undo                                             |
| `Ctrl` + `Y`         | Redo                                             |
| `Ctrl` + `S`         | Save now (it also saves by itself)               |
| `Ctrl` + `D`         | Duplicate the selected layer                     |
| Delete               | Delete the selected layer                        |
| Arrow keys           | Nudge the selected layer (`Shift` moves further) |
| `Alt` while dragging | Move freely, without snapping                    |
| Esc                  | Clear the selection                              |

### Keyboard shortcuts (Studio PiP)

Click the floating window first. Stepping an item that is live changes the live screen.

| Key                                 | Action                                      |
| ----------------------------------- | ------------------------------------------- |
| Right arrow / Page Down             | Next slide                                  |
| Left arrow / Page Up                | Previous slide                              |
| Home / End                          | First or last slide (Home restarts a video) |
| Hold `Ctrl` + `1`, `2`… then let go | Jump to slide N                             |
| Space                               | Pause or resume auto-play, or play a video  |
| Esc                                 | Close the window                            |

In an editor opened from the Studio, `Ctrl` + `S` updates the scene and `Ctrl` + `Enter` previews the edited version.

## Setup

You need Node 18 or newer (20 or 22 is best) and pnpm. npm and yarn work too. The app itself needs no server, database or account, because it keeps everything in the browser.

This repository is the frontend only. Two separate projects add optional features:

- The **GospelStudio relay server** ([`gospelstudio-relay-server`](https://github.com/marvelmiles/gospelstudio-relay-server)) carries live streams and the admin analytics dashboard.
- The **GospelStudio API** ([`gospelstudio-api`](https://github.com/marvelmiles/gospelstudio-api)) holds accounts and syncs each account's library between devices.

Without them, every other feature works as before.

## Installation

```bash
git clone https://github.com/marvelmiles/gospelstudio.git
cd gospelstudio
pnpm install
```

## Running

```bash
pnpm dev
```

Then open the address Vite prints. By default that is http://localhost:5173.

### Scripts

| Command                        | What it does                                            |
| ------------------------------ | ------------------------------------------------------- |
| `pnpm dev`                     | Start the Vite dev server with hot reload               |
| `pnpm build`                   | Check types with `tsc`, then build into `dist/`         |
| `pnpm preview`                 | Preview the production build, service worker included   |
| `pnpm typecheck`               | Check the app and server types without building         |
| `pnpm lint` / `lint:fix`       | Run ESLint over the repo                                |
| `pnpm format` / `format:check` | Run Prettier over `src/`                                |
| `pnpm test` / `test:watch`     | Run the Vitest tests                                    |
| `pnpm generate:hymns`          | Rebuild `src/data/hymns.json` from the freehymns hymnal |
| `pnpm generate:icons`          | Create the PNG icons from `public/icon.svg`             |
| `pnpm generate:thumbnails`     | Create small previews of the built-in background images |
| `pnpm generate:bible-layout`   | Rebuild the list of Bible books and chapters            |
| `pnpm contracts:sync`          | Copy `src/contracts` from the relay server and the API  |
| `pnpm contracts:check`         | Fail if `src/contracts` differs from either server      |

Run `pnpm generate:thumbnails` after adding a picture to `public/assets/images`. Lists and editors show the small copy from `public/assets/images/thumbs`, and only the projector loads the full picture.

The built-in sounds live in `public/assets/sounds` as AAC (`.m4a`, 160 kbps stereo), about half the size of the original MP3s with no audible loss. Add a new one to that folder and list it in `src/data/sounds.ts` with its length in seconds. The tracks come from freetouse.com.

## Environment variables

All of these are optional. Without them, cameras and Share still pair with a QR code or a pasted code, which needs no server at all.

To add one-tap pairing over WiFi, copy `.env.example` to `.env` and fill in your Firebase Realtime Database details. Firebase only passes along the short WebRTC handshake that introduces the two devices. The video and your files never go through it (see `src/features/pairing/PAIRING.md`).

| Variable                     | What it is            |
| ---------------------------- | --------------------- |
| `VITE_FIREBASE_API_KEY`      | Firebase web API key  |
| `VITE_FIREBASE_PROJECT_ID`   | Firebase project id   |
| `VITE_FIREBASE_APP_ID`       | Firebase web app id   |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL |

Cameras also need a secure page. Open the app over `https://` or `localhost` on both devices, or the browser will not turn the camera on.

Analytics is optional too. These are built into the public JavaScript, so they hold no secrets:

| Variable                      | What it is                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `VITE_PLAUSIBLE_DOMAIN`       | The site as added in Plausible, `gospelstudio.app`. Defaults to the address the app is opened on |
| `VITE_PLAUSIBLE_API_BASE_URL` | Plausible's address. Defaults to `https://plausible.io`, change it only when self-hosting        |

Tracking only runs in a production build opened on that domain or its `www.` address, so `pnpm dev`, `pnpm preview` and localhost are never counted. Without `VITE_PLAUSIBLE_DOMAIN`, every production deploy reports under its own address, deploy previews included. Plausible drops visits for addresses that are not added as sites, so set the variable when only one address should count.

Live streaming and the admin analytics dashboard need the address of the relay server. It is public, so it is built into the app:

| Variable                | What it is                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `VITE_RELAY_SERVER_URL` | The relay server's `https://` address. Without it the Stream dialog and the analytics dashboard say they are not set up |

The relay server keeps its own variables, including the secret Plausible Stats API key and the analytics admin token. They are listed in the relay server's `.env.example` and never go into this app's build.

Accounts and sync need the address of the API. It is public too:

| Variable       | What it is                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | The API's `https://` address. Without it there is no Sign in button and the library stays on each device |

## Deployment

`pnpm build` creates a static `dist/` folder that any static host can serve. The repo includes a `netlify.toml` for Netlify. On other hosts, publish `dist/` and send any unknown path to `index.html` so links inside the app keep working.

The build also writes one HTML file for each main page, such as `manuscripts.html` and `bible.html`, with that page's own title and description. Hosts serve them at `/manuscripts` and `/bible`, so a link shared on WhatsApp or another app shows the right preview. The titles and descriptions live in `src/lib/pageMeta.ts`.

The app is a static site only. Live streaming and the admin dashboard at `/admin/analytics` are served by the relay server, which runs on any server with Docker and a domain name (not on Netlify, because serverless functions cannot keep a stream open). Deploy it as its README describes, add this app's address to its `ALLOWED_ORIGINS`, then set `VITE_RELAY_SERVER_URL` for the app and redeploy. On Netlify, give it the Builds scope and every deploy context you build (Production, Branch deploys and Deploy Previews as needed), because a branch deploy such as `dev--` only sees variables in the Branch deploys context. `VITE_*` values are written into the app at build time, so adding or changing one has no effect until the next deploy. The build stops with a clear message if a value is not valid or only the old name `VITE_LIVE_RELAY_URL` is set, and its log warns when `VITE_RELAY_SERVER_URL` is missing. Set `VITE_PLAUSIBLE_DOMAIN` (and `VITE_PLAUSIBLE_API_BASE_URL` if needed) the same way. Plausible setup, goals and the full event list are in [`src/features/analytics/ANALYTICS.md`](src/features/analytics/ANALYTICS.md), and the streaming flow and troubleshooting are in [`src/features/liveStream/LIVE_STREAMING.md`](src/features/liveStream/LIVE_STREAMING.md).

For local development, clone the relay server next to this project, run `pnpm install` and `pnpm dev` there with `ALLOWED_ORIGINS=http://localhost:5173` in its `.env`, then set `VITE_RELAY_SERVER_URL=http://localhost:8080` in this project's `.env` and run `pnpm dev`.

Accounts work the same way. Deploy the API as its README describes, add this app's addresses to its `ALLOWED_ORIGINS`, set `VITE_API_URL` for every deploy context and redeploy. The build log warns when `VITE_API_URL` is missing. Locally, run the API on a free port (for example `PORT=8081`) with MongoDB, and set `VITE_API_URL=http://localhost:8081`.

### Shared contracts

The request and response shapes this app shares with its servers live in `src/contracts`. From the relay server: the live relay API and its close codes, the FLV format, the stream address rules, the analytics event catalog, and the report periods and types. From the API: the account, sign-in and sync schemas and the error codes. Each server owns its files and this project keeps an exact copy, so it builds and deploys on its own. After changing a contract, run `pnpm contracts:sync` here (it looks for `../gospelstudio-relay-server` and `../gospelstudio-api`, or the folders in `RELAY_SERVER_DIR` and `API_SERVER_DIR`). `pnpm contracts:check` fails when the copies differ. Never edit `src/contracts` in this project directly.

## Tech stack

- **App:** Vite, React 19, TypeScript, React Router and Zustand.
- **Styling:** Tailwind CSS 4 and shadcn/ui (Radix UI primitives and tw-animate-css), with clsx, tailwind-merge and class-variance-authority for combining classes.
- **Analytics:** Plausible through its official `@plausible-analytics/tracker` package. The admin dashboard reads the Plausible Stats API through the relay server.
- **Interface helpers:** Sonner for toasts, usehooks-ts for window size, media queries, element size and local storage, @dnd-kit for dragging slides, scenes and layers, react-rnd for moving and resizing layers in the Studio, and lucide-react for icons.
- **Slide and scene transitions:** the browser's Web Animations API.
- **Storage:** IndexedDB for documents and files, Zod to check backups, and fflate for the `.zip` format.
- **Live streaming:** WebCodecs for H.264 and AAC encoding in a Web Worker, `@sapphi-red/web-noise-suppressor` (RNNoise) for noise cancellation, Web Audio for the sound mix and polish, and Simple Icons (`@icons-pack/react-simple-icons`) for platform logos. The relay server is a separate project built with Express, `ws`, Zod, `express-rate-limit` and FFmpeg.
- **Cameras and sharing:** getUserMedia for webcams in the Studio, WebRTC for cameras on other devices, jsQR and qrcode-generator for pairing codes and on-screen QR codes, and Firebase Realtime Database as an optional signalling relay.
- **Accounts and sync:** the separate GospelStudio API (Express, MongoDB, Redis, Zod). In the browser, a change journal in IndexedDB, Web Locks so only one tab syncs or renews the sign-in at a time, and BroadcastChannel to refresh other tabs.
- **Offline:** vite-plugin-pwa and Workbox.

## Architecture

```
src/
  index.css        Tailwind entry: the shadcn theme variables, shadows, animations and custom utilities
  contracts/       exact copy of the servers' contracts: live relay API, FLV, stream address rules,
                   analytics event catalog, report periods and report types (relay server), and
                   accounts, sign-in, sync and error codes (API) (pnpm contracts:sync)
  lib/             parser, slide animations, style and background resolution, storage, zod schema, cn() in utils.ts,
                   the relay server and API addresses (relayServer.ts, apiServer.ts)
    analytics/     Plausible tracking, event properties, URL cleaning, sessions and opt-out
  data/            built-in backgrounds, themes, collections, fonts and seed manuscripts
                   (hymns.json holds the bundled hymnal, generated, not edited by hand)
  store/           Zustand store (state, actions and saving)
  components/
    ui/            shadcn/ui primitives (Button, Dialog, DropdownMenu, Select, Slider, Tabs, ...)
    shared/        app components built from them (Modal, MoreMenu, InfoTip, Field, EmptyState, TransitionLayers)
    layout/        header, navigation drawer and editor columns
    controls/      slide styling, background, audio, animation, playback and formatting pickers
    media/         image, video and audio surfaces and their settings
  hooks/           shared behaviour (text editing, media playback, wake lock, Go live, layout)
  features/
    dashboard/     Dashboard
    manuscripts/   Manuscript library, editor, text and settings modals
    editor/        Shared slide workspace, its edit hooks (deckEditor/) and slide list
    bible/         Reader, passage editor and the reader's selection and save hooks
    media/         Image and video libraries and editors
    assets/        Asset library: backgrounds, colors and sounds
    themes/        Themes page and theme editor
    presentation/  Presentation view, presenter bar and projection hooks
    studio/        Studio: the editable canvas, scenes, layers, properties, live controls,
                   the projector window (output/), scene item editors (itemEditor/),
                   the PiP window (pip/), its own Zustand stores (store/) and lib/,
                   and the program capture and sound mix shared by Record and Stream (capture/)
    pairing/       Device pairing shared by cameras and Share: QR and code exchange,
                   WebRTC peers, signalling and the pairing codec (lib/)
    cameraShare/   Share camera page: sends this device's camera to the Studio
    liveStream/    Live streaming to social platforms: the Stream button and dialog, the
                   saved platforms, the encoder worker and the relay server calls (lib/)
    share/         Share: handing a library and studio productions to a nearby device
    account/       Sign in, sign up, forgot and reset password, the Account page, the session
                   (tokens, stored sign-in, cross-tab messages) and the API calls (api/)
    sync/          Background sync: the change journal, push and pull, applying remote changes,
                   the sync engine and status, and the dialog that asks before uploading
    settings/      Settings modal, split into one file per section
    about/         About & Help modal and its FAQ list
    analytics/     Admin analytics dashboard (/admin/analytics), its charts and report hooks
    onboarding/    First-run welcome guide
    shortcuts/     Keyboard shortcuts modal
  routes.ts        every path in the app, one function per route
  App.tsx          layout shell, routes and global overlays
  ProjectionApp.tsx  the live windows shown on the projector (present and studio)
  main.tsx         entry point (Router, starts analytics outside projector windows)
scripts/           generators for hymns, icons, thumbnails and the Bible layout, and the contract sync
```

The live streaming relay and the analytics report API live in the separate `gospelstudio-relay-server` project, and accounts and sync in the separate `gospelstudio-api` project.

Components are written as `const` functions, each file does one job, and anything shared lives in a hook, a component or a `lib/` module.

## Notes and design choices

- **Styling is Tailwind first, built on the shadcn/ui theme.** The colors live in one place, as CSS variables on `:root` in `src/index.css` (`--background`, `--primary`, `--card`, `--border` and the rest, plus app tokens such as `--success` and `--stage`), and `@theme inline` turns them into utility classes. The app is dark only, so `<html>` carries the `dark` class. Components use utility classes, and `cn()` merges classes that depend on state. Inline styles are only used for values known while the app runs, such as a slide's chosen font, color or position.
- **`components/ui` is our own code.** Primitives are added with `pnpm dlx shadcn@latest add <name>` (see `components.json`) and then adjusted: the app's variants live in them, floating layers open inside the full screen element when there is one, and dialogs sit above the app's floating windows. App-specific components belong in `components/shared`.
- **Fields save straight to the store.** Editing updates the store as you type, so the preview changes instantly. Zod checks the one place where it really matters: imported backups.
- **The presenter view is a bar or a floating window**, not a separate app on a second monitor.
- **Only the current `.zip` backup format can be imported.** Older JSON exports are not supported.
- **The Studio draws on a fixed 1920 by 1080 stage.** Every layer is positioned in those units. The preview and live monitors scale it evenly, and the projector window and Preview tab stretch it to fill the whole screen, so a 16:9 projector shows it exactly and other shapes have no black bars. Layer order in the list is the stacking order.
- **Cameras on other devices come from the Share camera page.** The studio receives a device through one-tap signalling or a QR code exchange (`features/pairing`), and a dropped link restarts itself for a few minutes. Its picture goes into the same camera list as a webcam, so every scene and the projector window use it the same way.
- **The projector window gets its state over BroadcastChannel.** The studio sends the live scene, plus the songs, media and backgrounds it uses, to the projector window. Camera streams cannot be sent that way, so the projector window reads them from the studio window through `window.opener`. Camera sound plays from the studio window itself, so it is heard even when no projector window is open.
- **Live is a copy, not the scene.** GO LIVE copies the preview scene, so editing it afterwards never changes what the room sees until you press GO LIVE again. Live controls, the PiP window and Update scene from an item's editor change the copy and the scene together.
- **Scene items keep their own copy.** Open editor saves into the layer itself (`manuscript`, `passage` or `overrides`), never into the library, so a production can carry a changed song or passage that the library does not have.
- **Studio productions live in their own database** (`gospelstudio-studio`, version 1), next to the library database, so devices that already had a library get the studio stores without a version change. Reset and Free up space clear both.
- **The browser encodes, the relay only copies.** Browsers cannot send RTMP, so the Studio encodes H.264 and AAC itself with WebCodecs, with 2 second keyframes and a bitrate that adapts to the upload, and sends FLV over a WebSocket. The relay server copies it to every platform with FFmpeg without re-encoding, so it needs very little CPU and no third-party streaming service.
- **Record and Stream share one capture.** `studio/capture/programCapture.ts` hands out leases on a single screen capture and sound mix, so the projector window is picked once and closing it ends both.
- **Noise cancellation works offline too.** RNNoise's WebAssembly files (about 155 kB) are precached, so recordings made without internet are cleaned up as well.
- **The service worker also runs in development**, so you can test offline and install behaviour without a production build.
- **Sync rides on the existing storage, not beside it.** Every save already goes through `lib/storage.ts`, so it reports each changed record to a small journal (`gospelstudio-sync`), and the sync engine pushes whatever the journal lists by reading the record as it is now. Seeding, resets and changes downloaded from the account are written with `{ tracked: false }`, so the 845 built-in hymns, the first-run tour and the Studio's starter production never fill an account, and nothing echoes back.
- **Asking before uploading.** Signing in sets a stored "awaiting decision" flag. If this device has work the account does not, the sync dialog asks first, and the question survives a reload. Nothing syncs until it is answered.
- **The newest change wins.** Each journal entry keeps the time of the edit, and the API keeps the newer one, so an old offline edit never overwrites newer work from another device. On a device, what is on air and which scene is in preview stay local, so a production arriving from another device never cuts the live screen.
- **Remote records are checked like backups.** Pulled records go through the same Zod schemas and normalisers as an imported backup before they are saved. Settings that belong to one device (the first-run tour and the hymnal version) are never taken from the account.
- **Signing out keeps the library.** The library stays on the device and keeps working offline. Reset while signed in clears this device only, and the account's library downloads again; sign out first to clear a device completely.

## Hymn library

The hymns that come with the app are the English hymnal from [freehymns/hymns](https://github.com/freehymns/hymns). They are stored in `src/data/hymns.json`, added on first load, and marked `builtIn` so they can't be deleted by accident.

`pnpm generate:hymns` rebuilds that file using `src/lib/manuscript/hymnal.ts`, the same code the parser uses, so pasted hymn text is handled exactly like the built-in hymns. It turns headings like `Verse 1:` and `Refrain:` into sections, moves an `Author:` line out of the lyrics, drops tune notes, and joins up words split for singing, so `a-bide` becomes `abide`. That joining only runs on text that is really split for singing, so a word like `self-control` in your own manuscript stays as it is.

## License

The hymns are the public domain hymnal from [freehymns/hymns](https://github.com/freehymns/hymns), copied from The Cyber Hymnal and marked `Terms:Public Domain` at the source. You are welcome to use and adapt the code for your church or your own project.
