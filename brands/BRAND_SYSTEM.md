# Brand system — architectural overview

This document explains how the brand-config system in this fork is structured
and why it's shaped the way it is. Read this before changing how brands are
loaded, before adding new field categories, or before bringing a new brand
online for the first time. For day-to-day "how do I add a brand / how do I
run with a specific brand", see [`README.md`](./README.md).

## Goal

Run multiple community-specific apps from a single fork of `bluesky-social/social-app`,
without:

1. Forking `@bsky.app/alf` or any other upstream module that we don't own.
2. Making upstream merges painful — every weekly `git merge upstream/main`
   should be tractable, with conflicts concentrated in a small, predictable
   set of files.
3. Adding sprawling per-brand `if (brand.id === ...)` checks scattered across
   the codebase.

The system was designed against three real constraints that fall out of the
React Native + Expo + atproto stack:

- **Web is multi-tenant**, native is per-build. One web deployment can serve
  multiple brands by hostname; native apps go through the App Store / Play
  Store and need their own bundle id, icons, push certs, scheme — there is
  no way around this.
- **`app.config.js` is Node CommonJS** at native-build time (run by EAS
  Build, `expo prebuild`, etc.). It can't import TypeScript files or React
  Native modules.
- **Module-level constants are read everywhere.** `src/lib/constants.ts`
  exports things like `BSKY_SERVICE` that other modules import at module
  scope. Whatever brand value those constants resolve to needs to be set
  *before* those modules evaluate, not later via React context.

## High-level architecture

```
                              EXPO_PUBLIC_BRAND
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                                     │
       Native build time                        Runtime (web + native)
       (Node, app.config.js)                    (RN bundle / browser)
                  │                                     │
                  ▼                                     ▼
         brands/<id>/brand.js                src/brand/boot.ts
         (CJS, Node-safe)                    setActiveBrand(resolveBrand())
                  │                                     │
       app.config.js reads it                           ▼
       to populate name, scheme,            brands/<id>/brand.ts
       bundle id, splash, icons,            (TS, full app deps)
       app extensions, etc.                            │
                                            ┌─────────┴─────────┐
                                            ▼                   ▼
                                      module-level         React tree
                                      consumers           (BrandProvider
                                      (constants.ts,      → useBrand())
                                      themes.ts,
                                      headings.ts, etc.)
```

Two consumers (Node config-build vs RN runtime) read two files per brand
that share identity fields by composition, not duplication: `brand.ts`
imports `brand.js` and spreads it.

## The two-file split

Every brand has:

- **`brand.js`** — CommonJS, Node-safe. Identity (id, name, scheme), iOS/Android
  bundle ids, splash colors, app extensions, contacts permission string,
  associated domains. Read at native-build time by `app.config.js`.
- **`brand.ts`** — TypeScript, RN runtime. PDS endpoints, default feeds,
  links, blog URLs, feature flags, palette, logo. Read at app-boot time by
  `src/brand/registry.ts`.

The split exists for a hard reason: `brand.ts` imports `@bsky.app/alf` for
palette types, and the alf barrel transitively requires `react-native`
(`node_modules/@bsky.app/alf/dist/index.native.js:44`). If `app.config.js`
tried to evaluate `brand.ts`, Node would crash trying to require a native
module. We considered three workarounds and rejected each:

- **Convert `app.config.js` to `app.config.ts`.** Expo supports this, but
  `app.config.js` is a high-traffic upstream file. Renaming it makes every
  weekly merge a hand-resolved conflict — exactly the failure mode we're
  trying to avoid.
- **Generate `brand.js` from `brand.ts`** via a build script. Adds tooling,
  generated artifact in the tree (or `.gitignore`d, which complicates EAS
  builds). Not worth it for the small win.
- **Use deep imports** (`@bsky.app/alf/dist/palette`) and lazy-load image
  `require()` calls so `brand.ts` becomes Node-safe. Almost worked but the
  kawaii image `require('./assets/kawaii.png')` would still crash Node when
  any code path read the property. Edge cases multiply.

Composition was the cleanest answer: keep `brand.js` as the build-time-safe
file, have `brand.ts` import it via `import nativeConfig from './brand.js'`
and spread it. **No identity field is duplicated.** The TypeScript type
system enforces both contracts:

- `BrandConfig` (`brands/types.d.ts`) defines what `brand.js` must export.
  JSDoc `@type {import('../types').BrandConfig}` makes `// @ts-check` enforce
  the shape at the .js file site.
- `Brand` (`src/brand/types.ts`) is `BrandConfig & { …runtime fields }`.
  Adding a field to `BrandConfig` automatically requires it on every brand,
  on both sides.

When in doubt about which file a new field goes in:

- Does `app.config.js` read it (→ affects the native binary / app metadata)?
  Add to `BrandConfig` and `brand.js`.
- Does the running JS app read it? Add to `Brand` and `brand.ts`.

## Brand selection

Two paths, by platform:

- **Native**: brand is baked into the bundle via `EXPO_PUBLIC_BRAND` env at
  build time. Expo's babel plugin inlines `EXPO_PUBLIC_*` env vars at bundle
  time, so `process.env.EXPO_PUBLIC_BRAND` becomes a compile-time constant
  in the JS bundle. `BRAND` is also accepted as a fallback alias for local
  dev convenience. Defaults to `bluesky` when unset, so EAS jobs that don't
  set the env var keep producing the bluesky build untouched.
- **Web**: brand is resolved at boot from `window.location.hostname`. A small
  hostname → brand-id table lives in `src/brand/resolve.web.ts`. An explicit
  `EXPO_PUBLIC_BRAND` env var overrides hostname mapping (handy for local
  `yarn web` runs against a non-bluesky brand without faking your hostname).

Both paths fall back to `bluesky` for unknown ids / hostnames.

## Boot sequence — why ordering matters

`src/lib/constants.ts` reads `getActiveBrand()` at module top:

```ts
const brand = getActiveBrand()
export const BSKY_SERVICE = brand.pds.serviceUrl
// ... etc.
```

For this to work, `setActiveBrand()` must run *before* `constants.ts` is
imported by anything. The boot module enforces this:

```js
// index.js (native) and index.web.js
import 'react-native-gesture-handler'
import '#/platform/polyfills'
import '#/brand/boot'      // ← side-effecting: setActiveBrand(resolveBrand())
import App from '#/App'    // App's import graph pulls in constants.ts, themes.ts, …
```

Because `#/brand/boot` runs before `import App`, every downstream module sees
a populated `getActiveBrand()`. If anything ever transitively imports
`constants.ts` *before* `boot` runs, `getActiveBrand()` throws — by design,
to surface wiring bugs immediately rather than silently falling back to a
default. We mirror the same boot in `jest/jestSetup.js` so tests see a brand.

The boot module also enforces brand invariants (e.g. `defaultFeeds[0]` and
`[1]` must exist, since `constants.ts` reads them by index for the
`DISCOVER_SAVED_FEED` / `TIMELINE_SAVED_FEED` exports). Catching this at
boot means a misconfigured brand crashes immediately with a clear message,
not later with an undefined-spread error deep inside agent code.

## How the runtime brand reaches code

Three patterns coexist by design:

1. **Module-level constants.** `src/lib/constants.ts` reads `getActiveBrand()`
   once at module load and exposes the values as named exports. Call sites
   stay byte-identical to upstream (`import {BSKY_SERVICE} from '#/lib/constants'`).
   This is the most important pattern for sync-friendliness — the upstream
   diff against these call sites is zero. ~17 constants are sourced from the
   active brand this way.

2. **Top-level theme factory.** `src/alf/themes.ts` reads `getActiveBrand().palette`
   at module load and feeds it through `createThemes()` from `@bsky.app/alf`.
   The `themes` export keeps the same shape (`themes.light`, `themes.dim`,
   etc.) so `useColorModeTheme()` and the rest of ALF work unchanged.

3. **React context for component code.** `BrandProvider` wraps `<Alf>` in
   both `App.web.tsx` and `App.native.tsx`; `useBrand()` reads the brand
   inside components. Used wherever a string substitution or feature flag
   needs to be reactive in the React tree (e.g. `useBrand().name` in
   onboarding, `useBrand().features.allowForeignPdsSignup` in signup).

The pattern split matters: putting *everything* through `useBrand()` would
require changing every constants call site (the upstream merge surface we're
explicitly minimizing). Keeping module-level reads for fixed-at-boot values
preserves byte-identity with upstream.

## Sync-friendliness — what we did and didn't change

Upstream-merge cost is the dominant ongoing cost of running this fork. The
plan deliberately concentrates per-brand edits in a small set of files:

**Edited (high-traffic, expect upstream conflicts):**

- `src/lib/constants.ts` — most edits live here; brand-derived constants are
  the bulk of the change.
- `src/state/session/agent.ts` — one edited block (the signup default-pinned
  feeds), one new import.
- `src/Navigation.tsx` — one line for deep-link prefixes (planned; not yet
  landed).
- `src/App.{web,native}.tsx` — one wrap each (`<BrandProvider>`).
- `src/alf/themes.ts` — getter pattern; small diff.
- `src/screens/Signup/state.ts`, `src/screens/Login/index.tsx` — DEFAULT_SERVICE
  is brand-aware via constants.ts, so these need no changes today.
- `src/components/dialogs/ServerInput.tsx`, `src/components/forms/HostingProvider.tsx`
  — `locked` prop for signup PDS lock.
- `src/view/icons/{Logo,Logotype,Logomark}.tsx` — wrappers stay; they read
  brand SVG paths or raw XML.
- `app.config.js` — templatized but not renamed (deliberate, see above).
- ~10 user-facing string sites that say "Bluesky" — substituted with the
  brand name as a Lingui variable.

**Created (zero merge surface — files don't exist upstream):**

- `src/brand/{types,activeBrand,registry,resolve,resolve.web,context,boot}.ts(x)`
- `brands/<id>/{brand.js,brand.ts}` and supporting assets

The net upstream-merge surface for any given week: maybe `constants.ts` and
`agent.ts` if upstream touched the same blocks, plus rare conflicts in
`App.{web,native}.tsx`. The brand directories themselves never conflict.

## Things deliberately out of scope

- **Community-only search and discover.** Server-side filtering of search
  results / explore feeds requires a custom appview, not a client change.
  The client *can* swap default feed generators (which do their own
  server-side filtering) and route `brand.pds.appview` to a community appview
  if one exists. Anything beyond that is appview work.
- **Fundamentally different copy per brand.** We use `useBrand().name` as a
  Lingui variable inside the existing string site, not a per-brand copy
  registry. Less surface, less i18n complexity. If a brand needs genuinely
  different copy for a specific page (e.g. ToS intro), add a narrow
  `brand.copy.*` slot — capped at <10 fields, only when proven needed.
- **Auto-generated palette ramps from a single hex.** Brands supply full
  `primary_25..975` ramps; we don't ship a generator. HSL-shift generators
  produce muddy results for non-blue hues. Brands hand-tune their ramps
  starting from `DEFAULT_PALETTE` in `@bsky.app/alf`.
- **App Store assets, push certs, EAS configuration per brand.** These live
  in EAS and the App Store / Play console, not in the repo. The brand
  config sets the bundle id and scheme; the rest is operational.

## File map

```
brands/
├── README.md            ← day-to-day usage (add a brand, run a brand)
├── BRAND_SYSTEM.md      ← this file (architecture and rationale)
├── types.d.ts           ← BrandConfig type (consumed by brand.js JSDoc)
├── bluesky/
│   ├── brand.js         ← native-build identity for bluesky
│   ├── brand.ts         ← runtime brand for bluesky (spreads brand.js)
│   └── …
├── k4m2a/
│   ├── brand.js
│   └── brand.ts
└── mdparivaar/
    ├── brand.js
    ├── brand.ts
    └── logoIcon.svg.ts  ← extracted SVG string for the MD mark

src/brand/
├── types.ts             ← Brand = BrandConfig & {runtime fields}
├── activeBrand.ts       ← setActiveBrand / getActiveBrand
├── registry.ts          ← bluesky | k4m2a | mdparivaar lookup
├── resolve.ts           ← native: process.env.EXPO_PUBLIC_BRAND
├── resolve.web.ts       ← web: hostname → brand id
├── boot.ts              ← side-effecting; runs in entry points
└── context.tsx          ← BrandProvider + useBrand() for component code
```

## When you're confused

- **"Why isn't my new field showing up?"** — Did you add it to the right
  type? Native-build values go on `BrandConfig`; runtime values go on
  `Brand`. Did you populate it on every brand under `brands/`? TypeScript
  will tell you if not.
- **"`getActiveBrand()` threw at boot."** — Something imported `constants.ts`
  (or `themes.ts`, or another brand-aware module) before `#/brand/boot` ran.
  Find the offending import, ensure `boot` is the first non-trivial import
  in the entry file. For tests, `jest/jestSetup.js` does the same.
- **"My constants don't update when I change brands."** — Constants are
  resolved once at module load. Change `EXPO_PUBLIC_BRAND` and restart the
  bundler. There's no hot-swap.
- **"Why doesn't the logo theme correctly?"** — `SvgShape` has two modes:
  `path` mode (single path, gets dynamic fill from the wrapper) and `xml`
  mode (raw SVG string, theming via `currentColor` fills inside the XML
  only). If your brand SVG has hard-coded hex fills, swap them to
  `currentColor` to let the wrapper recolor them.
