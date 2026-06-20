# Rebranding / white-labeling

Brand identity is **one JSON file + a folder of SVGs + one command**. The visual
+ text rebrand happy path:

## 1. Edit `src/config/brand.json`

The single source of truth, editor-validated by `brand.schema.json` (your IDE
flags missing keys, bad hex values, an unknown `defaultAccent`, etc.). Sections:

- **identity** — `name`, `hosts` (your web domains; `hosts[0]` is primary),
  `socialHandle` (X/Twitter @, empty to omit).
- **`colors`** — `neutral` (the contrast_ ramp), `accents` (the selectable
  primary_ families), `defaultAccent` (the one this build ships).
- **`oauth`** — `defaultBaseUrl` (your domain), `clientName`, `scope` /
  `declaredScope`, `handleResolver`, `signupPdsHost`.
- **`links`** — legal / support / download URLs (point them at your own pages).
- **`services`** — atproto endpoints; default to the public Bluesky network,
  override only what you self-host.
- **`verification`**, **`ageAssurance`** — trust roots / age backend.

Build-time `EXPO_PUBLIC_*` env vars override a few of these per deployment (see
`.env.example`); keep those in the env, not the JSON.

## 2. Drop in your logos (`assets/brand/`)

One SVG per role. Only `mark.svg` is **required**; the rest are optional and fall
back to it, so a single-glyph brand and a symbol+wordmark brand both work:

| file          | role                                            |
| ------------- | ----------------------------------------------- |
| `mark.svg`    | the symbol/glyph (required; fallback for all)   |
| `wordmark.svg`| the styled brand name                           |
| `lockup.svg`  | symbol + word together                          |
| `hero.svg`    | large / marketing (a multi-tone "3D" logo lives here) |
| `icon.svg`    | app-icon-specific art (else the mark on a tile) |

**Theming convention** so one SVG follows light/dark + the accent picker:

- `fill="currentColor"` → the primary tint (driven by the component).
- `fill="theme:<paletteKey>"` (e.g. `theme:primary_900`) → substituted from the
  active palette at render. This is how a two-tone `hero.svg` follows the accent;
  there is no special "dimensional" data shape any more.

Plain colours (hex/rgb) render as-authored (for genuinely multi-colour logos).

## 3. Run the generators

```bash
pnpm brand         # gen-logo + sync-web + favicons - the full visual rebrand
pnpm brand:check   # CI guard: non-zero if the generated artifacts are stale
```

Under the hood (run individually if you like):

- `pnpm brand:gen-logo` — `assets/brand/*.svg` → `src/config/brand-logo.generated.json`
  (committed; consumed by `<BrandLogo>`, the splash, and the favicon mask).
- `pnpm brand:sync-web` — writes the colours / splash / og / title into the
  pre-boot HTML (`web/index.html`, `bskyweb/templates/base.html`).
- `pnpm brand:gen-favicons` — favicons + Safari mask from the icon master PNG.

That's the full visual + text rebrand. `BRAND.name` propagates through the UI
automatically; the upstream "Bluesky" → name swap lives in
`src/config/brandStrings.ts` (add message IDs there if any slip through).

## App icon + OG image (optional `gen-raster`)

Favicons are generated from the icon master at
`assets/app-icons/ios_icon_default_next.png` — replace it with your 1024×1024
square tile, or generate it from SVG:

```bash
pnpm brand:gen-raster            # from assets/brand/{icon,og}.svg if present
pnpm brand:gen-raster --compose  # else compose defaults from your mark
```

`gen-raster` is **optional and not a project dependency**. It auto-detects a
rasterizer — `@resvg/resvg-js` (install it yourself, never committed) →
`rsvg-convert` (`brew install librsvg`) → `magick` (ImageMagick) — and skips with
a message if none is present. It is **non-destructive**: it only writes an output
when its SVG source exists (`icon.svg` → icon master + favicons; `og.svg` →
`web/og-image.jpg`), or composes a default under `--compose`. A brand with
hand-designed raster art ships no source SVGs and is never touched.

## OAuth (per deployment)

You run your own OAuth confidential client (`services/oauth`); the `client_id` is
your domain. Generate a signing keypair once (do **not** commit the private half):

```bash
node scripts/gen-oauth-keypair.js   # writes the public JWKS (commit it);
                                    # prints the private JWK -> Worker secret
```

Deploy with `scripts/deploy-cloudflare.sh` (see `services/oauth/` and
`services/web/`). Note: the OAuth assertion host must be a **1-level subdomain**
(`oauth-brand.example.com`) **or** added as a Worker **Custom Domain** — a
2-level subdomain (`oauth.brand.example.com`) is not covered by Cloudflare's
Universal SSL and the TLS handshake will fail.

## Beyond the basics

- **Services** — edge services live in `services/`. Read APIs default to
  Bluesky's; override per build via `EXPO_PUBLIC_*` (see `.env.example`).
  GrowthBook flags + product metrics toggle via `EXPO_PUBLIC_ENABLE_*`.
- **Native build** (separate pass) — bundle IDs, app name, scheme, app groups,
  associated domains, EAS / App Store / Sentry / Firebase IDs live in
  `app.config.js`, `eas.json`, `ios/`, `android/`.
- **Content** (optional) — onboarding packs, suggested follows, default feeds,
  news sources, verifier DIDs: `src/screens/Onboarding/`,
  `src/features/newsFeed/sources.ts`, `src/lib/constants.ts`.
```
