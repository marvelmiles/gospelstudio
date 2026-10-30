# GospelStudio

**Church media application that runs in your web browser and works offline.**

GospelStudio is a church media application for displaying lyrics, hymns, Bible verses, sermon notes, pictures, and videos on projectors or TVs. It also supports live broadcasts using phone cameras. It works offline, stores content on your device, and requires no installation.

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

- **The library** keeps your manuscripts (songs, hymns and sermons), an offline Bible, images, videos, sounds, backgrounds, themes and saved camera overlays.
- **The editor** lets you type straight on the slide, so what you see is what the room will see.
- **Presentation mode** fills the projector, while your laptop shows your notes, the next slide and a timer.
- **Stream** connects up to three phone cameras and lets you put text and pictures on top of them.
- **Quick Share** copies your library to a nearby device, over WiFi or with a code.

It builds to plain static files, can be installed as an app (PWA), and updates itself in the background.

## Features

**Songs, slides and editing**

- **Paste and it becomes slides.** Tags like `[verse]` and `[chorus]` are recognised and numbered, and long parts are split across slides so the text stays big enough to read.
- **Manuscript library.** Lyrics, hymns, sermons and other decks, sorted into collections. Search by title, author or words.
- **Pin your favourites.** Keep up to five items at the top of each library.
- **Offline Bible.** The King James Version and the American Standard Version are built in. Read, search, save and present any passage with no internet, or have it read aloud.
- **Type on the slide itself.** The slide in the editor is where you type, so there is no separate text box to keep in sync.
- **Slide styling.** Font, size, weight, color, alignment, spacing and shadow, for one slide or the whole manuscript.
- **Pictures, clips and text boxes.** Drop them anywhere on a slide, then drag, resize and stack them. A selected clip shows its own player controls.
- **Text formatting.** Bold, italic, underline, strikethrough and highlight. The formatting is stored as plain text, so it survives copy and paste.
- **Backgrounds and sounds.** Pick one for a single slide or for the whole manuscript. Choosing None means silence, not the theme's sound.
- **Edit an asset for one place only.** The pencil opens a picture, clip or sound in its editor, and your changes apply to that one use only.
- **Built-in backgrounds.** Pictures, moving video backgrounds, colors and gradients come ready to use. You can edit them, but not delete them.
- **Images and videos.** Upload once and use them anywhere: as a background, on a slide, over a live camera, or sent to another device.
- **Themes.** A theme sets the whole look of a manuscript. Use the built-in ones or make your own in the theme editor.

**Presenting**

- **Presentation mode.** Full screen, with a presenter bar that shows your notes, the next slide, a timer and a slide counter. You can pause, and background music can loop while you present.
- **Slide animations.** Fade, Cross Fade, Dissolve, Zoom and Slide in four directions. Set one for the whole app, a theme, a manuscript or a single slide, and preview it in the editor.
- **Auto-play.** Slides move forward by themselves after the number of seconds you choose, and can loop back to the start for announcement slideshows.
- **Go live or preview.** Go live sends the slides to the audience screen. Preview here shows them only on your own screen.
- **Go live fills the projector.** With a screen connected over HDMI, the audience window opens already full screen on it, using the browser's Window Management API.
- **Allow the projector ahead of time.** The Projector section in Settings lets you give the display permission before the service starts, so your first Go live goes straight to the projector.
- **A second module in the corner.** Show a picture, a clip or a live camera in a corner of the slides. It plays live alongside them.
- **Keyboard control.** Hold `Ctrl` and type a number to jump to a verse, or press `Ctrl+C` for the chorus. The slide list shows each shortcut before you start.

**Live camera**

- **Up to three cameras at once.** One fills the screen while the others sit in a corner or wait off screen, ready to switch to.
- **Easy pairing.** On the same WiFi, a phone shows up in a list and one tap connects it. With no internet, the devices scan each other's QR codes instead.
- **Codes a webcam can read.** The pairing code is squeezed into one small QR code, and the scanner looks for it across the whole camera view.
- **Keeps going when the phone sleeps.** A wake lock and a silent sound keep the page awake, and a dropped connection reconnects by itself.
- **Full screen on the phone.** The phone fills its screen with what it is sending, even on iPhones, where websites normally can't go full screen.
- **Save overlays for next time.** Save any text, picture or clip you put over the camera, with its position and style, and add it to a later broadcast from Saved.

**Sharing and data**

- **Quick Share.** Every device with the page open on the same WiFi can see the others. Pick who to send to, then pick what to send from each part of your library.
- **Everything an item needs goes with it.** A manuscript brings its background, sound, clips and theme. The other device can accept or decline.
- **Works with no internet.** Devices that can't find each other pair with a QR code or a typed code, just like the cameras.
- **Watch your sends.** Each device shows its own progress and a stop button, and a transfer keeps going if the phone goes to sleep.
- **Backup.** Export your whole library, pictures and videos included, into one `.zip` file and bring it back later. The file is checked before anything is imported.
- **Install it and use it offline.** The app is saved on your device, so it opens with no internet and tells you when a new version is ready.

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

## Setup

You need Node 18 or newer (20 or 22 is best) and pnpm. npm and yarn work too. There is no server, database or account to set up, because the app keeps everything in the browser.

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
| `pnpm typecheck`               | Check types without building                            |
| `pnpm lint` / `lint:fix`       | Run ESLint over the repo                                |
| `pnpm format` / `format:check` | Run Prettier over `src/`                                |
| `pnpm test` / `test:watch`     | Run the Vitest tests                                    |
| `pnpm generate:hymns`          | Rebuild `src/data/hymns.json` from the freehymns hymnal |
| `pnpm generate:icons`          | Create the PNG icons from `public/icon.svg`             |
| `pnpm generate:thumbnails`     | Create small previews of the built-in background images |
| `pnpm generate:bible-layout`   | Rebuild the list of Bible books and chapters            |

Run `pnpm generate:thumbnails` after adding a picture to `public/assets/images`. Lists and editors show the small copy from `public/assets/images/thumbs`, and only the projector loads the full picture.

## Environment variables

All of these are optional. Without them, cameras and Quick Share still pair with a QR code or a pasted code, which needs no server at all.

To add one-tap pairing over WiFi, copy `.env.example` to `.env` and fill in your Firebase Realtime Database details. Firebase only passes along the short WebRTC handshake that introduces the two devices. The video and your files never go through it (see `src/features/stream/STREAM_SIGNALING.md`).

| Variable                     | What it is            |
| ---------------------------- | --------------------- |
| `VITE_FIREBASE_API_KEY`      | Firebase web API key  |
| `VITE_FIREBASE_PROJECT_ID`   | Firebase project id   |
| `VITE_FIREBASE_APP_ID`       | Firebase web app id   |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL |

Cameras also need a secure page. Open the app over `https://` or `localhost` on both devices, or the browser will not turn the camera on.

## Deployment

`pnpm build` creates a static `dist/` folder that any static host can serve. The repo includes a `netlify.toml` for Netlify. On other hosts, publish `dist/` and send any unknown path to `index.html` so links inside the app keep working.

The build also writes one HTML file for each main page, such as `manuscripts.html` and `bible.html`, with that page's own title and description. Hosts serve them at `/manuscripts` and `/bible`, so a link shared on WhatsApp or another app shows the right preview. The titles and descriptions live in `src/lib/pageMeta.ts`.

## Tech stack

- **App:** Vite, React 19, TypeScript, React Router and Zustand.
- **Styling:** Tailwind CSS 4 and shadcn/ui (Radix UI primitives and tw-animate-css), with clsx, tailwind-merge and class-variance-authority for combining classes.
- **Interface helpers:** Sonner for toasts, usehooks-ts for window size, media queries, element size and local storage, @dnd-kit for dragging slides, and lucide-react for icons.
- **Slide transitions:** the browser's Web Animations API.
- **Storage:** IndexedDB for documents and files, Zod to check backups, and fflate for the `.zip` format.
- **Cameras and sharing:** WebRTC, with jsQR and qrcode-generator for pairing codes, and Firebase Realtime Database as an optional signalling relay.
- **Offline:** vite-plugin-pwa and Workbox.

## Architecture

```
src/
  index.css        Tailwind entry: the shadcn theme variables, shadows, animations and custom utilities
  lib/             parser, slide animations, style and background resolution, storage, zod schema, cn() in utils.ts
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
    presentation/  Presentation view, presenter bar, second module and projection hooks
    stream/        Camera sharing: sender/, receiver/, stage/, overlays and lib/
    share/         Quick Share: handing a library to a nearby device
    settings/      Settings modal, split into one file per section
    about/         About & Help modal and its FAQ list
    onboarding/    First-run welcome guide
    shortcuts/     Keyboard shortcuts modal
  routes.ts        every path in the app, one function per route
  App.tsx          layout shell, routes and global overlays
  ProjectionApp.tsx  the live window shown on the projector
  main.tsx         entry point (Router)
```

Components are written as `const` functions, each file does one job, and anything shared lives in a hook, a component or a `lib/` module.

## Notes and design choices

- **Styling is Tailwind first, built on the shadcn/ui theme.** The colors live in one place, as CSS variables on `:root` in `src/index.css` (`--background`, `--primary`, `--card`, `--border` and the rest, plus app tokens such as `--success` and `--stage`), and `@theme inline` turns them into utility classes. The app is dark only, so `<html>` carries the `dark` class. Components use utility classes, and `cn()` merges classes that depend on state. Inline styles are only used for values known while the app runs, such as a slide's chosen font, color or position.
- **`components/ui` is our own code.** Primitives are added with `pnpm dlx shadcn@latest add <name>` (see `components.json`) and then adjusted: the app's variants live in them, floating layers open inside the full screen element when there is one, and dialogs sit above the app's floating windows. App-specific components belong in `components/shared`.
- **Fields save straight to the store.** Editing updates the store as you type, so the preview changes instantly. Zod checks the one place where it really matters: imported backups.
- **The presenter view is a bar or a floating window**, not a separate app on a second monitor.
- **Only the current `.zip` backup format can be imported.** Older JSON exports are not supported.
- **The service worker also runs in development**, so you can test offline and install behaviour without a production build.

## Hymn library

The hymns that come with the app are the English hymnal from [freehymns/hymns](https://github.com/freehymns/hymns). They are stored in `src/data/hymns.json`, added on first load, and marked `builtIn` so they can't be deleted by accident.

`pnpm generate:hymns` rebuilds that file using `src/lib/manuscript/hymnal.ts`, the same code the parser uses, so pasted hymn text is handled exactly like the built-in hymns. It turns headings like `Verse 1:` and `Refrain:` into sections, moves an `Author:` line out of the lyrics, drops tune notes, and joins up words split for singing, so `a-bide` becomes `abide`. That joining only runs on text that is really split for singing, so a word like `self-control` in your own manuscript stays as it is.

## License

The hymns are the public domain hymnal from [freehymns/hymns](https://github.com/freehymns/hymns), copied from The Cyber Hymnal and marked `Terms:Public Domain` at the source. You are welcome to use and adapt the code for your church or your own project.
