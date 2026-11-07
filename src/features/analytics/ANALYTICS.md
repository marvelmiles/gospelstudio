# Analytics

GospelStudio uses [Plausible Analytics](https://plausible.io/docs) to answer two questions: how many people visit the site, and how many of them actually use its features. Plausible uses no cookies and keeps no personal profiles. GospelStudio adds a typed list of feature events on top, and an admin dashboard that reads the numbers back through the Plausible Stats API.

## The numbers and what they mean

| Number                              | Meaning                                                                                                    | Comes from                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Unique visitors                     | Plausible's estimate of distinct visitors in the period                                                    | `visitors` for the whole period                    |
| Total visits                        | Sessions. A visit ends after 30 minutes with no activity                                                   | `visits`                                           |
| Page views                          | Every page opened, including moves inside the app                                                          | `pageviews`                                        |
| Occurrences (total actions)         | How many times an event happened. One person creating five manuscripts is five                             | `events` per goal, which can be added together     |
| Unique visitors who did an event    | How many visitors did it at least once. One person creating five manuscripts is one                        | `visitors` per goal                                |
| Feature unique visitors             | Visitors who did any of a feature's actions, each counted once                                             | one `visitors` query filtered by all those goals   |
| Active feature users                | Visitors who did any tracked action, each counted once                                                     | one `visitors` query filtered by all usage goals   |
| Returning visitors                  | Visitors whose browser had already used GospelStudio on an earlier day                                     | `visitors` broken down by the `visitor_type` property |

Unique visitors are never added up. A feature's unique visitors and the period totals are asked from Plausible as one question each, because the same person can appear in several goals, on several days or in several chart points. Occurrences are plain counts, so those are safe to add.

Plausible recognises a browser for one day only (its salt rotates every 24 hours), so a person who visits on three days counts three times in a monthly total, and a person on two devices counts twice. Treat every visitor number as an estimate, never as a count of real people.

## How it works

```
Browser                                              Server (Netlify Function)
main.tsx ─ startAnalytics() ─ plausible.ts            /api/analytics/report
             │  init once, cleans every URL              │  checks the admin key
             │  adds visitor_type                        │  validates section and dates (Zod)
feature code ─ trackEvent() ── trackEvent.ts            │  caches answers, limits concurrency
             │  typed events, dedupe keys                ▼
             ▼                                         Plausible Stats API v2 (POST /api/v2/query)
           plausible.io/api/event                        │
                                                          ▼
                                                 /admin/analytics dashboard
```

- `src/lib/analytics/analyticsEvents.ts` is the single list of events, the feature each belongs to, whether it counts as usage, whether it is interactive and which properties it may carry. The server reads the same file to build the feature report.
- `src/lib/analytics/plausible.ts` wraps the official `@plausible-analytics/tracker` package. It starts once, only in production builds served from `VITE_PLAUSIBLE_DOMAIN` or its `www.` address, and never in the projector or preview windows. The tracker follows History API navigation on its own, so there is no route listener in React. It counts a page view only when the path changes, never for re-renders or query string changes.
- `src/lib/analytics/trackEvent.ts` is the only way the app sends an event. It does nothing when analytics is off or the visitor opted out, drops repeats that share a dedupe key inside 30 minutes, and never throws.
- `src/lib/analytics/analyticsSessions.ts` pairs Started and Ended events so a session starts once and ends once, and ends open sessions when the tab closes.
- `src/main.tsx` loads analytics in parallel with the app and ignores any failure, so it never delays or breaks the app.
- `server/analytics/` holds the Stats API client, the cache, request validation, the admin key check and the report builder. `netlify/functions/analytics-report.ts` is the thin Netlify entry.

## Event catalog

Every event also carries `visitor_type` (`new` or `returning`). Events marked non-interactive do not affect bounce rate, and events marked not usage are left out of feature totals and Active feature users.

| Event                      | Feature           | Sent when                                                                                           | Properties                        | Notes                                                                 |
| -------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| Studio Opened              | Studio            | The Studio page finishes loading a production                                                       |                                   | Once per visit to the page. Non-interactive                           |
| Studio Session Started     | Studio            | The Studio's projector screen opens                                                                 |                                   | A blocked popup does not count                                        |
| Studio Session Ended       | Studio            | The projector screen closes, or the tab closes while it is open                                     |                                   | Non-interactive. Not usage                                            |
| Manuscript Created         | Manuscripts       | A new manuscript is saved to the library for the first time                                         |                                   | A failed save (storage full) sends nothing                            |
| Manuscript Edited          | Manuscripts       | An existing manuscript is saved                                                                     |                                   | At most once per manuscript per 30 minutes, and not in the 30 minutes after it was created |
| Manuscript Deleted         | Manuscripts       | A manuscript is deleted after the confirm dialog                                                    |                                   |                                                                       |
| Production Scene Created   | Production Scenes | A scene is added and appears in the production                                                      | `source`: blank, template, layout, duplicate |                                                            |
| Production Scene Edited    | Production Scenes | A scene's content or settings change, or an item editor updates it                                  |                                   | At most once per scene per 30 minutes. Undo, redo, stepping slides and playing videos do not count |
| Production Scene Deleted   | Production Scenes | A scene is removed                                                                                  |                                   |                                                                       |
| Production Scene Activated | Production Scenes | GO LIVE or Cut sends the preview scene to the live screen                                           |                                   |                                                                       |
| Bible Opened               | Bible             | The Bible page opens                                                                                |                                   | Non-interactive                                                       |
| Bible Chapter Opened       | Bible             | A chapter opens in the verse list or the reader                                                     |                                   | Once per chapter per visit to the Bible page                          |
| Bible Verse Displayed      | Bible             | A Bible passage is presented                                                                        |                                   |                                                                       |
| Presentation Started       | Presentations     | Presentation mode opens                                                                             | `content`: manuscript, scripture, image, video | Moving to another item while presenting does not start a new one |
| Presentation Ended         | Presentations     | Presentation mode closes, or the tab closes while presenting                                        |                                   | Non-interactive. Not usage                                            |
| Camera Broadcast Started   | Camera Broadcast  | The Share camera page connects to a Studio for the first time in a sharing session                  | `method`: one_tap, code           | Reconnecting after a sleep is the same broadcast                      |
| Camera Broadcast Ended     | Camera Broadcast  | Sharing stops, the page is left or the tab closes                                                   |                                   | Non-interactive. Not usage                                            |
| Camera Broadcast Failed    | Camera Broadcast  | The camera could not open, or the connection failed before it was ever live                         | `method`, `reason`: camera_unavailable, connection_failed | Diagnostics. Not usage                        |
| Media Uploaded             | Media             | An upload finishes with at least one image, video or sound saved                                    | `kind`: image, video, audio       | One per upload, however many files                                    |
| Image Presented            | Media             | An image is presented                                                                               |                                   |                                                                       |
| Video Presented            | Media             | A presented video actually starts playing                                                           |                                   | Once per video per presentation                                       |

The brief also listed Presentation Media Displayed. It would fire at exactly the same moment as Image Presented and Video Presented, so it is left out rather than counting one action twice. Camera broadcasts are the app's own phone-to-Studio cameras shown on projectors and TVs. Nothing is sent to YouTube or any streaming service.

To add an event: add it to `ANALYTICS_EVENTS`, add its properties to `EventPropsWithValues` if it has any, call `trackEvent` where the action has succeeded, and add the goal in Plausible.

## What is never sent

Only the event name, a cleaned page address and the small fixed properties above leave the device. TypeScript only accepts the listed property values, so free text cannot be passed by mistake.

- No manuscript, song, hymn, sermon or Bible note text, no titles, no presentation text.
- No file names, file contents, pictures, videos, camera or microphone streams.
- No IndexedDB or local storage contents, and no device or visitor identifiers.
- Page addresses are cleaned before sending: record ids become the route pattern (`/manuscripts/:manuscriptId`), any path that is not an app page becomes `/unknown-page`, and every query string is dropped except `utm_*`, `ref` and `source`. That keeps the Share camera pairing tokens and offers in its links out of the request. Same-site referrers are cleaned the same way.
- `/admin/*` pages are never tracked.

The only value GospelStudio stores for analytics is the first day the browser used the app (`gospelstudio:first-active-day`, a date such as `2026-11-06`). It is compared on the device to send `new` or `returning`, and the date itself is never sent.

## Opting out

Settings, Privacy, Share anonymous usage statistics. Turning it off sets Plausible's own `plausible_ignore` flag in local storage, forgets the first-day stamp and stops sending. The choice survives Reset and the automatic fresh start after an update. The official tracker can still send one last engagement ping (time on page and scroll depth) for the page that was already counted, at the moment the switch is turned off. Nothing is sent after that.

## Setting up Plausible

1. **Add the site.** In Plausible, add `gospelstudio.app`. It must match `VITE_PLAUSIBLE_DOMAIN` and `PLAUSIBLE_SITE_ID` exactly.
2. **Set the reporting time zone.** In the site settings under General, choose Lagos (GMT+01:00), or whatever `ANALYTICS_TIMEZONE` is set to. The dashboard works out Today, This week and the other periods in that zone, and Plausible counts days in the site's zone, so the two must agree.
3. **Add the goals.** In the site settings under Goals, choose Add goal, then Custom event, and type each name exactly as written in the catalog above, capitals included. Add all 21. Plausible receives events without goals but shows nothing for them, and it does not fill in the past once a goal is added, so add them before or right after the first deploy. The dashboard lists any action with no data in the period, which makes a missing goal easy to spot.
4. **Add the custom properties.** In the site settings under Custom properties, add `visitor_type`, `content`, `kind`, `source`, `method` and `reason`. Custom properties need the Business plan. Without them the dashboard shows Returning visitors as Not set up and everything else keeps working.
5. **Create a Stats API key.** Open the account settings, then API Keys, choose New API Key and pick Stats API. Copy it straight away, because it is shown once. The Stats API needs the Business plan, and keys can only be made by team members with Owner, Admin, Editor or Billing roles.
6. **Check the install after deploying.** Open the site, then the browser's Network tab, and filter for `api/event`. The page view and each action should answer with status 202. Plausible's Verify installation also works, because the tracker exposes `window.plausible`. The Realtime view on the Plausible dashboard should show the visit within a minute.

Plausible filters bots, crawlers, referrer spam and data centre traffic on its own. To keep your own visits out, turn usage statistics off in Settings on your devices, or block your IP address under Shields in Plausible.

## Setting up the server (Netlify)

In Netlify, under Site configuration, Environment variables:

| Variable                      | Scope     | Value                                              |
| ----------------------------- | --------- | -------------------------------------------------- |
| `VITE_PLAUSIBLE_DOMAIN`       | Builds    | `gospelstudio.app`                                 |
| `VITE_PLAUSIBLE_API_BASE_URL` | Builds    | `https://plausible.io` (optional)                  |
| `PLAUSIBLE_API_KEY`           | Functions | the Stats API key                                  |
| `PLAUSIBLE_SITE_ID`           | Functions | `gospelstudio.app`                                 |
| `ANALYTICS_ADMIN_TOKEN`       | Functions | a random secret of at least 32 characters          |
| `PLAUSIBLE_API_BASE_URL`      | Functions | `https://plausible.io` (optional)                  |
| `ANALYTICS_TIMEZONE`          | Functions | `Africa/Lagos` (optional)                          |

Make an admin token with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Redeploy after changing any of them. Variables with a `VITE_` prefix are built into the public JavaScript, so the API key and admin token must never have that prefix. Scope selection needs a Pro plan on Netlify; without it every variable reaches every scope, which is still safe because only `VITE_` variables reach the browser.

The function answers `GET /api/analytics/report?section=overview|features|audience&period=...` with `Authorization: Bearer <admin token>`. It returns `{ "data": ... }` or `{ "error": { "code", "message" } }` with these statuses: 400 for a bad section, period or date range, 401 for a missing or wrong admin key, 405 for anything but GET, 503 when the server variables are missing or Plausible's hourly limit is reached (with `Retry-After`), 502 when Plausible rejects the key, the plan or the query, and 504 when Plausible does not answer in 10 seconds. Responses are never cached by browsers or the CDN.

To run the dashboard locally, install the Netlify CLI, put the server variables in `.env`, and run `netlify dev`. Plain `pnpm dev` serves the app without the function, and the dashboard says so.

## The dashboard

Open `/admin/analytics` and enter the admin token. It is not linked from the app, search engines are told to skip it, and the token is kept in that browser tab only.

- **Periods:** Today, Yesterday, Last 7 days, Last 30 days, This week, Last week (weeks start on Monday), This month, Last month and a custom range of up to two years. The server works the dates out in `ANALYTICS_TIMEZONE` and sends Plausible explicit dates.
- **Overview:** unique visitors, visits, page views, returning visitors, active feature users and tracked actions, with a trend chart for people (unique visitors and active feature users) or traffic (visits and page views) and a table view of every point. Each point's unique visitors stands alone and is never added to the others.
- **Feature engagement:** most used features by unique visitors, and a table of unique visitors, total actions and returning visitors per feature, which opens up to show every action.
- **Where visitors come from:** top sources, countries, devices and browsers.

Answers are cached on the server for 2 minutes when the period includes today and for an hour otherwise, and at most four Stats API requests run at once. A fresh load of all three sections costs about 18 requests, well inside Plausible's 600 an hour.

## Testing

`pnpm test` runs the unit tests for URL cleaning, deduplication, sessions, visitor type, report periods and time zones, the Stats API client, caching, the report builder and the request handler (auth, validation, errors, no key in responses). After a deploy, check the Network tab and the Plausible Realtime view as described in step 6.

## Limitations

- Unique visitors are estimates that reset every day, as described above. Plausible cannot say how many real people use GospelStudio, and GospelStudio does not try to work it out with identifiers or fingerprinting.
- Returning visitors rely on the first-day stamp in the browser, so clearing site data, private windows and new devices make returning people look new.
- Ad and tracker blockers stop some visits and actions from being counted.
- Nothing is queued offline. Actions taken without a connection are not sent later, so offline use is undercounted on purpose, to avoid duplicates and stored data.
- Ended events sent while a tab is closing use the browser's keepalive request and can occasionally be lost, so Started and Ended totals may differ slightly.
- Each tab keeps its own sessions, so presenting in two tabs counts two presentations.
- The Stats API and custom properties need Plausible's Business plan.
- The report function is written for Netlify. Another host needs its own small wrapper around `createReportHandler` in `server/analytics/reportHandler.ts`.
