# Device pairing and signalling

This folder pairs two devices for the Share camera page and the Studio, and
supplies the same code exchange to Share. A phone, tablet or laptop sends its
camera to the computer running the Studio two ways:

1. **One tap (needs Firebase).** The device opens _Share camera_ and presses
   _Start sharing_; in the Studio, the camera window's _Another device_ pane
   lists it live. Click Connect. No codes.
2. **QR or pasted code (offline fallback).** The two devices swap a code by
   camera, or by any messaging app. Works with no internet at all, and is always
   available.

## Linking a phone to one Studio

The QR code in the Studio's _Another device_ pane is a link made for that Studio
(`lib/cameraLink.ts`). With signalling it carries the Studio's room and a random
studio token; the phone opens _Share camera_, starts sharing in that room and
announces the token, and the Studio connects the device that carries it without
a click. Pairing with a code shows a link too: it carries the offer, so the
phone's own camera app opens _Share camera_ ready to answer, and the Studio then
scans the reply. Link values are checked with Zod before use, and the page
clears them from the address bar once read.

## How the codes are shown and read

**One request, one code.** A pairing code is always a single QR that never
changes while it is on screen. That only works because the description behind it
is kept small, in three steps:

1. **Fewer codecs.** The offer names H.264, VP8 and rtx for video and Opus for
   audio (`lib/peerTuning.ts`), instead of the twenty-odd codecs a browser lists
   by default. Every WebRTC browser is required to support VP8, so a phone can
   always answer, and H.264 still wins where the phone encodes it in hardware.
2. **Fewer candidates.** The transmitted copy drops TCP and link-local
   candidates, which can never win a LAN pairing (`lib/sdp.ts`). The local
   description keeps everything it gathered.
3. **Shared-dictionary compression.** Both devices deflate against the same
   table of SDP boilerplate (`lib/sdpDictionary.ts`), so a description costs only
   the bytes unique to this call, and the result is Base45 encoded to stay in the
   QR alphanumeric mode.

Together these turn a roughly 6 KB description into a code of a few hundred
characters: a QR of about 80 modules, drawn at medium error correction so it
reads through screen glare and camera blur.

The dictionary is part of the wire format. Both devices must hold the same one,
so changing it means bumping `PREFIX` in `lib/pairingSignal.ts`; a code from a
mismatched build is rejected rather than half-decoded.

The scanner (`lib/useQrScanner.ts`) reads the **whole camera frame** as well as
the centred aiming box, so a code does not have to fit neatly inside the box. It
uses the browser's own barcode detector where one exists and jsQR in a worker
otherwise, alternating resolutions so both a crisp and a slightly blurred frame
have a chance to decode.

## What Firebase is (and is not) doing

Firebase is an **ephemeral signalling middleman only**, never storage:

- It relays one WebRTC offer and one answer (a few hundred bytes of text).
- The **camera video never touches Firebase.** Media flows phone to laptop
  directly over the LAN (peer to peer, DTLS encrypted). The connection uses
  LAN-only ICE candidates; the one public STUN call only derives a room id and
  carries no media.
- The moment the peer link reaches _connected_, both sides **delete** the
  handshake payload. `onDisconnect().remove()` also wipes a device's data if it
  closes or crashes, so the database sits empty during a live session.
- A broadcaster leaves only a tiny presence row (name and timestamp) while it
  waits, refreshed once a minute and re-announced whenever its socket
  reconnects, so a phone that slept still appears in the list.

Result: near zero reads and writes, and effectively no stored data, so it stays
inside the Firebase free tier for normal use.

## Staying connected

A phone that sleeps or is backgrounded is expected, not treated as a failure:

- The sharing device holds a screen wake lock while it is broadcasting.
- ICE `disconnected` reads as **Reconnecting**, never as a dropped camera.
- When a one-tap connection does fail, the laptop restarts ICE and re-sends the
  offer through signalling every few seconds for three minutes, and the phone
  answers as soon as it is back. Only after that window is the camera reported
  as stopped.
- If the operating system ended the camera capture while the page was hidden,
  the sender reopens it when the page is visible again.

## Setup

1. Create a free Firebase project.
2. **Build, then Realtime Database, then Create database.**
3. Copy the config values into a `.env` file (see `.env.example`):
   ```
   VITE_FIREBASE_API_KEY=…
   VITE_FIREBASE_PROJECT_ID=…
   VITE_FIREBASE_APP_ID=…
   VITE_FIREBASE_DATABASE_URL=https://<project>-default-rtdb.firebaseio.com
   ```
4. Paste the rules below into **Realtime Database, then Rules**.

Restart the dev server. Camera pairing and Share now default to one tap; without
these variables they silently use the QR or pasted code instead.

## Recommended Realtime Database rules

These confine all access to the ephemeral `signal/` subtree, forbid everything
else, and cap how large a stored description can be so the node cannot be abused
as storage:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "signal": {
      "$room": {
        ".read": true,
        ".write": true,
        "devices": {
          "$device": {
            ".validate": "newData.hasChildren(['name','ts'])",
            "name": {
              ".validate": "newData.isString() && newData.val().length < 64"
            },
            "studio": {
              ".validate": "newData.isString() && newData.val().length < 64"
            },
            "ts": { ".validate": "newData.isNumber()" }
          }
        },
        "calls": {
          "$device": {
            "offer": {
              ".validate": "newData.isString() && newData.val().length < 20000"
            },
            "answer": {
              ".validate": "newData.isString() && newData.val().length < 20000"
            },
            "viewerId": {
              ".validate": "newData.isString() && newData.val().length < 64"
            },
            "ts": { ".validate": "newData.isNumber()" }
          }
        },
        "share": {
          "devices": {
            "$device": {
              ".validate": "newData.hasChildren(['name','ts'])",
              "name": {
                ".validate": "newData.isString() && newData.val().length < 64"
              },
              "ts": { ".validate": "newData.isNumber()" }
            }
          },
          "calls": {
            "$device": {
              "$caller": {
                "offer": {
                  ".validate": "newData.isString() && newData.val().length < 20000"
                },
                "answer": {
                  ".validate": "newData.isString() && newData.val().length < 20000"
                },
                "name": {
                  ".validate": "newData.isString() && newData.val().length < 64"
                },
                "ts": { ".validate": "newData.isNumber()" }
              }
            }
          }
        }
      }
    }
  }
}
```

The `share` subtree carries Share, which hands a whole library from one device
to another (`src/features/share/SHARE.md`). It relays the same
offer and answer and nothing else; a deployment running the earlier rules keeps
working, because read and write are already granted for the whole room. Adding
the block above only tightens what may be written.

The rooms are public within the `signal/` namespace, which is fine because a
room id is derived from your network's public IP (people not on your WiFi do not
share it) and the media itself is encrypted peer to peer. For stricter isolation
across venues that share an ISP, add Firebase Anonymous Auth and gate
`.read`/`.write` on `auth != null`.
