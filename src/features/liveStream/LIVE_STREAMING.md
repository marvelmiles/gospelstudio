# Live streaming

Anyone who opens GospelStudio can stream the Studio's live screen to YouTube, Facebook, Instagram, TikTok, X, Twitch, LinkedIn, Kick or any RTMP service, all at the same time. They only paste the server URL and stream key each platform gives them. There are no accounts, no access keys and no third-party streaming service with quotas or per-minute bills. The platforms deliver the stream to viewers worldwide.

## How it works

```
Studio (Chrome or Edge)                     Relay server (Docker, any server)      Platforms
-----------------------                     -------------------------------        ---------
projector window ─┐
phone cameras ────┼─ program capture ─► encoder worker ─► WebSocket ─► FLV fan-out ─► FFmpeg copy ─► rtmps://YouTube
sound desk ───────┘  (one window pick,   H.264 + AAC       (adaptive    (starts each   (no          ─► rtmps://Facebook
                      shared with        2 s keyframes      bitrate)     platform on    re-encoding) ─► rtmp://Twitch ...
                      Record)            30 fps                          a keyframe)
```

1. **Capture.** `studio/capture/programCapture.ts` asks the browser to share the projector window once. Record and Stream share it. Sound from the shared tab, from phone cameras that are on the live screen, and from a chosen sound desk input is mixed with Web Audio at 48 kHz (`programSound.ts`). It then goes through RNNoise noise cancellation (`noiseSuppression.ts`) and the polish chain (`soundPolish.ts`): an 80 Hz rumble filter, a gentle leveler and a limiter.
2. **Encode in the browser.** `lib/liveEncoderPipeline.ts` runs in a Web Worker, so it keeps going when the Studio tab is in the background. It uses WebCodecs to encode H.264 (High, Main or Baseline, whichever the computer supports, usually in hardware) and AAC at 128 kbps stereo. Frames are paced at a constant 30 fps, so a still slide keeps streaming, and a keyframe is forced every 2 seconds as YouTube and Facebook require. Encoded frames are wrapped in FLV (`src/contracts/flv.ts`) and sent over a WebSocket.
3. **Adapt to the network.** `lib/adaptiveBitrate.ts` watches how much data is waiting to be uploaded, the same idea as OBS's dynamic bitrate. When the upload backs up, the picture bitrate drops quickly (to a floor set by the quality). If it backs up badly, video frames are skipped while sound keeps flowing. When the connection stays calm for 8 seconds, the bitrate climbs back. If the connection drops, the worker reconnects by itself for about 75 seconds, and the relay holds the platforms open for 90.
4. **Relay without re-encoding.** The relay server (the separate `gospelstudio-relay-server` project) reads the FLV, keeps the latest codec headers, and starts one FFmpeg per platform with `-c copy`. Each platform starts on a keyframe. A platform that is slow to receive skips ahead to the next keyframe without holding up the others. A platform that drops is retried with growing delays (2, 4, 8, 15 and 30 seconds) and is marked "Not receiving" after six failed tries in a row. The Studio's Try again button restarts it.
5. **Status.** The relay pushes each platform's state (waiting, connecting, live, reconnecting, not receiving) over the same WebSocket. The Studio shows it per platform, with the connection strength and upload speed in the header.

Because the relay only copies packets, one small server carries many streams. Each stream uses about 3 to 5 Mbps coming in and the same going out to each platform. The CPU cost is a small fraction of a core per platform.

## Setting it up

### 1. Run the relay server

The relay lives in the separate `gospelstudio-relay-server` project. Its README covers deploying it with Docker and Caddy (or on Fly.io, Railway or Render), its variables, sizing and its full API. In short: on a server with Docker and a domain name, set `ALLOWED_ORIGINS` to this app's address and `RELAY_DOMAIN` to the server's address, then run `docker compose up -d --build`. Check `https://<RELAY_DOMAIN>/healthz`.

### 2. Point the app at it

Set `VITE_RELAY_SERVER_URL=https://<RELAY_DOMAIN>` for the app (in Netlify, with the Builds scope) and redeploy. That is all: every visitor can now stream.

### Local development

In the relay server project, set `ALLOWED_ORIGINS=http://localhost:5173` in `.env` and run `pnpm dev`. It uses the bundled FFmpeg from `ffmpeg-static`. Then set `VITE_RELAY_SERVER_URL=http://localhost:8080` in this project's `.env` and run `pnpm dev`.

## Using it

1. In the Studio, open the projector screen (Present, then Go live).
2. Press **Stream**, then add each platform with its server URL and stream key. YouTube, Facebook and Twitch fill in their server URL. The others show where to find theirs.
3. Choose the picture quality and the sound options, then press **Go live**. When the browser asks what to share, choose the projector screen window.
4. While live, the header shows **LIVE**, the time and the connection strength. Open it to watch each platform's status, switch platforms on or off, retry one that stopped, or end the stream.

| Quality         | Picture         | Video bitrate         | Upload needed |
| --------------- | --------------- | --------------------- | ------------- |
| Full HD 1080p   | 1920 x 1080, 30 | 4.5 Mbps, down to 1.5 | about 6 Mbps  |
| HD 720p         | 1280 x 720, 30  | 2.5 Mbps, down to 0.7 | about 4 Mbps  |
| Data saver 480p | 854 x 480, 30   | 1 Mbps, down to 0.25  | about 2 Mbps  |

Sound is always AAC 128 kbps stereo at 48 kHz.

Streaming needs Chrome or Edge on a Windows or Mac computer: they have the WebCodecs H.264 and AAC encoders and the screen capture the Studio uses. The dialog says so on other browsers and phones.

## Security and privacy

- **Stream keys stay on the device.** They are saved in this browser's local storage, never in backups or Share, and are cleared by Reset. They go to the relay server over HTTPS only while streaming. It keeps them in memory for that stream only, never writes them to disk or logs, and redacts them from every error it reports.
- **Each stream is private.** Starting a stream creates a session with a random 256-bit key. Only the session key can change its platforms, read its status or send it media, and the relay stores only a hash of it. Sessions end when the studio ends them, 90 seconds after the studio disconnects, or 5 minutes after creation if the studio never connects.
- **Only your site can use the relay server.** HTTP requests and WebSocket connections from origins not in `ALLOWED_ORIGINS` are refused.
- **No requests to internal servers.** Destinations must be `rtmp://` or `rtmps://` addresses without user names or passwords, and the relay resolves each host name and refuses private, loopback and link-local addresses.
- **Abuse limits.** Requests are validated with Zod and limited to 32 KB. Each address may create 30 sessions per 10 minutes and make 600 requests per minute. A session can stream to up to 10 platforms, and a stream faster than `MAX_INGEST_KBPS` is closed. `MAX_SESSIONS` caps the server's load and the relay answers 503 instead of slowing down.

## API

The endpoints, Zod schemas, WebSocket messages and close codes are defined once in `src/contracts/liveRelay.ts`, which is an exact copy of the relay server's contract (see Shared contracts in the main README). The relay server's README documents every endpoint, error code and close code.

## Code map

```
src/contracts/
  liveRelay.ts                endpoints, Zod schemas and close codes shared with the relay server
  flv.ts                      FLV muxing and streaming parser, shared with the relay server
  streamUrl.ts                address rules and stream key redaction, shared with the relay server
src/lib/relayServer.ts        the relay server address from VITE_RELAY_SERVER_URL
src/features/liveStream/
  lib/liveQuality.ts          the three quality profiles
  lib/streamPlatforms.ts      platform names, default server URLs and where to find keys
  lib/adaptiveBitrate.ts      the upload-backlog bitrate controller
  lib/liveEncoderPipeline.ts  WebCodecs encoding, frame pacing, keyframes and FLV, in the worker
  lib/ingestConnection.ts     the WebSocket with sign-in and reconnecting
  lib/liveEncoderClient.ts    support checks and starting the worker
  lib/liveRelayApi.ts         the relay server's REST calls
  lib/liveStreamSession.ts    going live, platform changes and ending
  components/                 the Stream button, the dialog and its sections
src/features/studio/capture/  shared program capture, sound mix, RNNoise and polish
```

The relay server's tests include one that streams real H.264 and AAC through it to two RTMP servers with FFmpeg and checks what they receive.

## Troubleshooting

- **Live streaming is not set up on this site yet.** `VITE_RELAY_SERVER_URL` is missing from the app's build.
- **The streaming relay isn't running at this address.** The relay server is down or the URL is wrong. Open `/healthz` on it.
- **This site is not allowed to use the relay server (403).** Add the app's exact address to `ALLOWED_ORIGINS` on the relay server.
- **A platform shows Not receiving.** The key is wrong or used up (Facebook keys can be single use unless you choose a persistent key), or the platform is not waiting for a stream. Fix the key while the platform is switched off, then switch it on or press Try again.
- **This streaming server is full right now.** Raise `MAX_SESSIONS` if the server has bandwidth to spare, or run a second relay server.
- **Very weak connection.** Choose HD 720p or Data saver 480p, close other uploads on the network, or move closer to the router.
- **Instruments sound thin.** Turn noise cancellation off during worship music. It is tuned for speech.
