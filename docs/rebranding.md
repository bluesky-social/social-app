# Rebranding / white-labeling

Brand identity is data + two scripts. The visual + text rebrand happy path:

## 1. Edit the config (`src/config/`)

- **`brand-meta.json`** — `name`, `hosts` (your web domains), `socialHandle`.
- **`brand-colors.json`** — `neutral` ramp, `accents` (the selectable families), `defaultAccent`.
- **`brand-logo.json`** — `flat` wordmark (required). Set `dimensional: null` if you have no 3D logo; hero surfaces fall back to the flat wordmark in the accent.
- **`brand.ts`** — `links` (legal/support/download URLs).

## 2. Drop in the app icon

Replace `assets/app-icons/ios_icon_default_next.png` with your 1024×1024 square tile.

## 3. Run the generators

```bash
pnpm brand:gen-favicons   # favicons + safari mask, from the icon tile
pnpm brand:sync-web       # writes colors/splash/og/title into web/index.html + bskyweb/templates/base.html
pnpm brand:check-web      # CI guard: non-zero if the above is out of sync
```

That's the full visual + text rebrand. `BRAND.name` propagates through the UI automatically; the upstream "Bluesky" → name swap lives in `src/config/brandStrings.ts` (add message IDs there if any slip through).

## Beyond the basics

- **Services** — edge services live in `services/` (Bunny scripts). Network read APIs default to Bluesky's (until eurosky appview is available). You **must** run your own **OAuth** (`services/oauth` — the client_id is your domain); optionally your own OG / analytics / geolocation / age. Point the app at them via `EXPO_PUBLIC_*` env vars (see `.env.example`). Bluesky's GrowthBook flags + product metrics are toggled by the `EXPO_PUBLIC_ENABLE_*` flags.
- **Native build** (separate pass) — bundle IDs, app name, scheme, app groups, associated domains, EAS / App Store / Sentry / Firebase IDs: `app.config.js`, `eas.json`, `ios/`, `android/`.
- **Content** (optional, still eurosky-specific) — onboarding packs, suggested follows, default feeds, news sources, verifier DIDs: `src/screens/Onboarding/`, `src/features/newsFeed/sources.ts`, `src/lib/constants.ts`.
