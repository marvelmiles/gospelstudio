import { APP_NAME } from "../../lib/appInfo";
import { ANIMATION_OPTIONS } from "../../lib/animation";
import { MAX_KEPT_ITEMS } from "../../lib/keepOnReset";
import { MAX_PINNED_ITEMS } from "../../lib/pinning";
import { MAX_STREAM_CAMERAS } from "../stream/lib/streamSession";

export interface Faq {
  question: string;
  answer: string;
}

export interface FaqGroup {
  title: string;
  faqs: Faq[];
}

const animationNames = ANIMATION_OPTIONS.map((option) => option.label).join(
  ", ",
);

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Getting started",
    faqs: [
      {
        question: `What is ${APP_NAME}?`,
        answer: `${APP_NAME} is a church media application for displaying lyrics, hymns, Bible verses, sermon notes, pictures, and videos on projectors or TVs. It also supports live broadcasts using phone cameras. It works offline, stores content on your device, and requires no installation.`,
      },
      {
        question: "Do I need the internet?",
        answer: `No. Once the page has loaded one time, ${APP_NAME} works fully offline. You can also install it like a normal app. On a computer, click the Install icon in your browser's address bar. On a phone or tablet, choose "Add to Home Screen". It then opens in its own window. The only parts that use the internet are the one-tap connect for cameras and finding nearby devices in Quick Share, and both have an offline option called Pair with a code.`,
      },
      {
        question: "Does it work on a phone or tablet?",
        answer:
          "Yes. Every page fits small screens. On a phone, the editors split into Slides, Edit and Style tabs, and any header icons that do not fit move into a menu. To send slides to a projector you still need a computer, but a phone makes a great camera for the Stream page.",
      },
      {
        question: "How do I save my work?",
        answer:
          "Your changes are kept as a draft until you save them, so you can try things freely. The Save button turns blue when there is something to save, and Ctrl+S saves too. If you try to leave with unsaved work, the app asks you first. Ctrl+Z undoes a change and Ctrl+Y brings it back. If you change a song while it is already on the screen, press Ctrl+Shift+U to send your saved changes to the running presentation.",
      },
      {
        question: "Does New Manuscript create something straight away?",
        answer:
          "No. It opens an empty editor, and nothing is added to your library until you save. If you leave without saving, you are asked first. If you did not type anything, nothing is left behind.",
      },
      {
        question: "How do I clear a search?",
        answer:
          "Click the small X on the right side of any search box, or press Escape while you are typing in it. The box empties and stays ready for you to type again.",
      },
    ],
  },
  {
    title: "Songs, sermons and slides",
    faqs: [
      {
        question: "How do I turn lyrics into slides?",
        answer: `Paste your lyrics, a hymn or a sermon outline into a manuscript, and ${APP_NAME} makes the slides for you. You can mark each part with a tag like [verse], [chorus], [bridge], [intro], [outro], [tag], [refrain] or [pre-chorus], and the slides get clean labels and numbers. [solo] counts as a verse. You can also give a part its own number, like [Verse 3], and the verses are put in the right order for you. If you do not use tags, a blank line between parts works too. Start the text with a line like HYMN: Amazing Grace or SERMON: The Good Shepherd and that line becomes the title and puts the manuscript in the right collection. To make words bold, italic, underlined, crossed out or highlighted, select them and use the formatting bar.`,
      },
      {
        question: "Why do slides sometimes split on their own?",
        answer: `Text starts at size 6, which people can read from the back of the room, and every slide keeps some space above and below the words. ${APP_NAME} works out how many lines fit at your text size. Anything that does not fit moves onto the next slide instead of getting squeezed. So if you make the text bigger, one slide may become two, and making it smaller joins them back. Slides you split, merged or copied by hand stay as they are, and so do slides with a picture, clip or text box on them. Ctrl+Z undoes any change.`,
      },
      {
        question: "Can I split, merge, copy or reorder slides?",
        answer:
          "Yes. Select a slide and use the buttons in the style panel beside it (the Style tab on a phone) to copy it, split it in two, join it with the next slide, or delete it. You can also right-click a slide (or press and hold on a phone) for the same options. Drag slides to change their order, and add a blank slide anywhere. You can place pictures, clips and text boxes anywhere on a slide, move them with the arrow keys, and remove them with Delete.",
      },
      {
        question: "Can I keep my favourite songs at the top?",
        answer: `Yes. Click the pin icon on a manuscript, a saved Bible passage, a picture or a video, and it stays at the top of that list. You can pin up to ${MAX_PINNED_ITEMS} items in each list. Click the pin again to unpin it.`,
      },
      {
        question: "What is a theme?",
        answer: `A theme is a saved look that you can use again and again. It holds the font, text color, size, background, slide animation and even background music. Choose a theme in a manuscript's settings and every slide takes on that look at once, so you do not have to style slides one by one. Any single slide can still have its own look. Open Manage themes from the header to create and edit themes. ${APP_NAME} comes with a few built-in themes. You can edit them but not delete them. Themes you make yourself can be edited or deleted at any time.`,
      },
      {
        question: "Can I change how slides move from one to the next?",
        answer: `Yes. You can choose from ${animationNames}. Set the animation for everything in Settings under Transitions, where you can also choose how long it takes. A theme or a manuscript can have its own animation, and so can a single slide: select the slide, pick an animation in the style panel, and press Preview animation to see it play.`,
      },
      {
        question: "How does auto-play work?",
        answer:
          "Turn on Auto-play in a manuscript's settings, a Bible passage's settings or a theme, then choose how many seconds each slide should stay on screen. The slides then move forward by themselves. Turn on the loop option too and the slideshow starts again from the first slide after the last one, which is great for announcements before a service. With auto-play off, slides only change when you move to the next one.",
      },
      {
        question: "Can I play background music during worship?",
        answer:
          "Yes. Add a sound to a whole manuscript, a theme or a single slide, and it plays softly while you present. Some gentle worship pads come with the app, you can upload your own, and you can use the sound from any of your videos. You can set the volume in Settings.",
      },
    ],
  },
  {
    title: "The Bible",
    faqs: [
      {
        question: "How do I show a Bible verse?",
        answer:
          "Open the Bible page and pick a book, a chapter and a verse. You can switch between the King James Version and the American Standard Version, or type a reference like John 3:16-18 in the Go to reference box. Click a verse to select it, and Ctrl-click another verse to select more. Then press Present to show it right away, or Edit to adjust the slides first. Double-clicking a verse shows just that verse. Save Passage keeps your selection as slides you can style and use again from the Saved tab.",
      },
      {
        question: "Can I shorten book names when I type a reference?",
        answer:
          "Yes. You can type the full name or a short form. John 3:16, Jn 3:16, Gen 1:1, Ps 23 and 1 Cor 13:4-7 all work. Even the first few letters of a book are enough, so Eccl finds Ecclesiastes. Capital letters, dots and spaces do not matter. Add a dash for a range of verses (John 3:16-18), or stop at the chapter (John 3) to open that chapter.",
      },
      {
        question: "Can the app read the Bible aloud?",
        answer:
          "Yes. Press Read chapter aloud at the top of the reader, or select some verses and press Read. While a passage is on the screen, press R to start or stop the reading. It uses the voice built into your device.",
      },
      {
        question: "Does the Bible work offline?",
        answer:
          "Yes, completely. Both translations are built into the app, so reading, searching and saved passages all work with no internet. The app never downloads verses from an online Bible service. The Bible Text & Licensing section further down explains where the text comes from.",
      },
    ],
  },
  {
    title: "Presenting",
    faqs: [
      {
        question: "How do I show my slides on a projector or TV?",
        answer: `Connect the projector or TV to your computer with an HDMI cable. In your computer's display settings, choose Extend, not Duplicate. Then open a song, Bible passage, picture or video, press Present and choose Go live. The first time, your browser asks if the site can manage windows. Choose Allow. ${APP_NAME} then shows the slides on the projector, while the controls and your notes stay on your laptop. You can also give this permission ahead of time in Settings, under Projector. If your browser cannot place the window for you, it opens on your laptop screen, and you can drag it onto the projector.`,
      },
      {
        question: "What is the difference between Go live and Preview here?",
        answer:
          "Go live sends the slides to the audience screen, such as a projector or TV. Preview here shows the slides only on your own screen, so you can check them without anyone else seeing. The shortcuts are Ctrl+Shift+Enter for Go live and Ctrl+Enter for Preview here.",
      },
      {
        question: "The projector screen is not full screen. How do I fix it?",
        answer: `Most of the time ${APP_NAME} fills the projector by itself. If it does not, press F11 straight after Go live, while the live window is still selected. You can also click the live window and press F, or click the full screen arrow in its top right corner. Press F11 or Esc to leave full screen.`,
      },
      {
        question: "How do I control the slides while presenting?",
        answer:
          "Use the arrow keys or Space to move between slides, P to pause, F for full screen, V to change how the picture fits the screen, + and - to zoom, 0 to reset the zoom, and I to show or hide the presenter bar. To jump to a verse, hold Ctrl, type its number and let go (Ctrl+2 goes to Verse 2). Other parts have their own keys: Ctrl+C for Chorus, Ctrl+B for Bridge, Ctrl+I for Intro, Ctrl+O for Outro, Ctrl+P for Pre-Chorus, Ctrl+R for Refrain and Ctrl+T for Tag. Click the keyboard icon in the header to see every shortcut. If you use the floating presenter window, click it first so it hears your keys.",
      },
      {
        question: "Can I show a picture, video or camera in a corner?",
        answer:
          "Yes. While presenting, press the second module button in the controls and choose a live camera, a video or a picture. It shows in a corner of the slides, and you can move it or remove it at any time.",
      },
    ],
  },
  {
    title: "Pictures, videos and sounds",
    faqs: [
      {
        question: "Can I edit pictures, videos and sounds?",
        answer:
          "Yes, and your original file is never changed. For pictures you can change brightness, contrast and color, blur, rotate, flip, darken it so words on top are easier to read, and choose how it fits the screen. For videos you can cut the start and end, change the volume and speed, mute or loop, and adjust the colors. Sounds have their own editor for cutting and volume. Press Space to play and pause in the video and sound editors.",
      },
      {
        question: "Can I use my own colors or pictures as backgrounds?",
        answer:
          "Yes. In the Asset library you can upload your own pictures and videos, pick a color, or type your own color or gradient code. You can also upload a picture straight from any background list. Give each color a name so it is easy to find later. Videos play silently as moving backgrounds.",
      },
      {
        question:
          "Where do the pictures, videos and sounds in a list come from?",
        answer:
          "From everywhere in the app at once, so you never have to fetch anything first. A background list shows your backgrounds together with the pictures on your Images page and the clips on your Videos page, newest first. A sound list shows your sounds and the sound from any of your videos. In the Asset library, you can add anything from your Images and Videos pages as a background with one click, and the pencil opens its editor.",
      },
      {
        question:
          "If I edit a background inside one song, does it change everywhere?",
        answer:
          "No. There are two ways to edit a picture, video or sound. If you edit it from the Asset library or the Images and Videos pages, you change the file itself, and every new use starts from your changes. If you edit it from inside a manuscript, a passage or a single slide, the change only applies there. Everywhere else stays the same. The editor always tells you which one you are doing before you save.",
      },
      {
        question: "What comes built in, and what can I change?",
        answer: `${APP_NAME} comes with hymns, themes, background pictures, moving video backgrounds, colors and soft worship sounds, so you always have something to start with. Built-in items cannot be deleted. You can still edit the built-in hymns, themes, pictures and videos. Anything you add yourself is yours to edit or delete.`,
      },
      {
        question: "Can I put a built-in item back the way it was?",
        answer:
          "Yes. Open a built-in hymn or theme and press Reset to default in the top bar. It asks you to confirm first, and nothing changes until you save, so Ctrl+Z can still undo it. The picture, video and sound editors have a Reset all button that puts every change back to how the file started.",
      },
      {
        question: "What happens if I cancel an upload?",
        answer:
          "Cancel stops the upload and removes any files from that batch that were already added, so you never end up with half your files. Before saving, you can give each file a name so it is easy to find later. If you do not, it keeps its file name.",
      },
    ],
  },
  {
    title: "Cameras and sharing",
    faqs: [
      {
        question: "How do I show a phone camera on the screen?",
        answer: `Open the Stream page on both devices. On the computer connected to the projector, choose Show a camera here. On the phone, choose Share this camera. If both devices are online, the phone shows up in a list on the computer, and one click connects it. With no internet, choose Pair with a code instead: the phone scans the code on the computer, then the computer scans the reply on the phone. You can also copy and paste the codes. The video goes straight between the two devices over your WiFi, and it keeps going even if the phone screen goes to sleep. You can connect up to ${MAX_STREAM_CAMERAS} cameras: show one full screen and keep the others ready to switch to. Both devices need an address that starts with https://, because browsers only allow cameras on secure pages.`,
      },
      {
        question: "Can I put text or pictures over a live camera?",
        answer:
          "Yes. While a camera is on the screen, you can add a banner across the bottom, a block of text, a scrolling announcement, a picture, a clip or a saved Bible passage on top of it. You can place and style each one, and show or hide it without stopping the camera. Save one you like and it is ready for next time.",
      },
      {
        question: "How do I send songs and slides to another device?",
        answer:
          "Open Quick Share from the menu on both devices, connected to the same WiFi. Pick the device you want to send to, then tick the songs, passages, pictures, videos, sounds or themes you want. Anything an item needs, like its background or sound, goes with it. The other device is asked to accept before anything arrives, and everything already on it is kept. With no internet, choose Pair with a code on the sending device and Receive with a code on the other one, then scan each other's code.",
      },
    ],
  },
  {
    title: "Your data",
    faqs: [
      {
        question: "Where is my work stored?",
        answer: `Everything stays on your own device, inside your browser. ${APP_NAME} does not upload your songs, notes or pictures anywhere. Because of that, clearing your browser's data for this site will remove your library, so make a backup from time to time.`,
      },
      {
        question: "How do I back up my work or move it to a new device?",
        answer:
          "Open Settings and press Export Data. This saves your whole library, including pictures, videos and sounds, into one .zip file. On the other device, press Import Data and choose that file. You can replace everything there, or merge the two and choose which copy wins when both have the same item. If both devices are on the same WiFi, Quick Share does the same thing with no file to carry.",
      },
      {
        question: "What happens when I reset the app?",
        answer: `Reset App to Defaults, in Settings, deletes all your manuscripts, your own themes, backgrounds, sounds and settings, and puts the app back to how it was the first time you opened it. It cannot be undone, so you have to type ResetApp to confirm. To keep something safe, mark up to ${MAX_KEPT_ITEMS} manuscripts or themes as Keep on reset first, and they survive the reset.`,
      },
    ],
  },
];
