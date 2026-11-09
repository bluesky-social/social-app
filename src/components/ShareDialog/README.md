# Share platforms

The apps the post share sheet can send a post to, like Messages, WhatsApp
and Telegram. The row only shows apps that are installed.

- `catalog.ts` lists every app: its name, how to detect it, and how to open it
  with the post. Array order is the default display order.
- `detect.ts` returns which catalog apps are installed. The result is never
  stored or logged.
- `share.ts` opens an app with the post. Most apps take a link that fills it
  in. For apps with no such link, Android sends it to the app's own share
  screen (`directShare`), and iOS copies the link and opens the app so the
  person pastes it (`copyAndOpen`).

## What a change needs

`app.config.js` loads `catalog.ts` to declare the iOS URL schemes
(`LSApplicationQueriesSchemes`) and Android packages (manifest `<queries>`)
we're allowed to check. The OS reports anything undeclared as not installed.

| Change | Ships via |
|---|---|
| Add an app, or change its iOS `scheme` or Android `packages`/`scheme` | Native release |
| Change a share link, label or order | OTA update |
| Add an icon | OTA update via `assets/icons/tmp/`, then into the font before the next native release (see `scripts/icons/README.md`) |

`fingerprint.config.js` ignores `catalog.ts` itself, so only edits that change
the resolved native config change the fingerprint.

iOS allows at most 50 query schemes. `catalog.test.ts` checks the limit.
