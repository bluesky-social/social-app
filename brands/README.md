# brands/

White-label configuration for community-specific deployments of the social
app. Each subdirectory is one brand. The directory name is the brand id used
by `EXPO_PUBLIC_BRAND` and by the hostname mapping in `src/brand/resolve.web.ts`.

For the architectural overview (why the system is shaped the way it is, what
the boot sequence looks like, what the constraints were), see
[`BRAND_SYSTEM.md`](./BRAND_SYSTEM.md).

## Running a specific brand locally

```bash
# Default — bluesky (no env var needed)
yarn web

# k4m2a — monochrome black/white visual brand. Uses the coseeker.org PDS and
# the k4m2a community feed.
EXPO_PUBLIC_BRAND=k4m2a yarn web

# MDParivaar — saffron #CD7233 brand with the Madhyasth Darshan icon. Uses the
# coseeker.org PDS and the mdparivaar community feed.
EXPO_PUBLIC_BRAND=mdparivaar yarn web

# CoSeeker — clone of k4m2a's monochrome visuals, served at coseeker.com. Uses
# the coseeker.org PDS and the coseeker community feed.
EXPO_PUBLIC_BRAND=coseeker yarn web
```

The same env var works for native:

```bash
EXPO_PUBLIC_BRAND=k4m2a yarn ios
EXPO_PUBLIC_BRAND=mdparivaar yarn ios
```

If `EXPO_PUBLIC_BRAND` is unset, the app falls back to `bluesky`. On web, the
hostname mapping in `src/brand/resolve.web.ts` overrides the default but is
itself overridden by an explicit `EXPO_PUBLIC_BRAND` (useful for local dev).

## Files in a brand directory

- `brand.js` — CommonJS native-build identity (name, scheme, bundle id, app
  extensions, splash colors). Read by `app.config.js` at native build time.
- `brand.ts` — TypeScript runtime brand (PDS, default feeds, links, feature
  flags, palette, logo). Read by `src/brand/registry.ts`. **Imports
  `./brand.js` and spreads it** — there is no field duplication between
  the two files.
- `assets/` — brand-specific icons, splash images, logos.

## Why two files?

`app.config.js` is a CommonJS Node script that runs at native-build time
(under EAS Build, `expo prebuild`, etc). It cannot import `brand.ts`
directly because:

1. There's no TypeScript loader in that environment — converting
   `app.config.js` to `app.config.ts` would work, but it's a high-traffic
   upstream file and renaming it makes every weekly merge a hand-resolved
   conflict. We pay a tiny structural cost here to keep upstream merges
   trivial.
2. `brand.ts` imports `@bsky.app/alf` (for the palette) and references
   `require('./assets/*.png')` for kawaii images. Both crash under Node.

So `brand.js` carries everything `app.config.js` needs — identity,
bundle ids, splash, app extensions. `brand.ts` carries everything the
running app needs — palette, logo, PDS, links, feeds, features. The
runtime side imports the build side via `import nativeConfig from
'./brand.js'; const brand = {...nativeConfig, ...runtimeFields}`, so
there's exactly one source of truth for every field.

**Rule of thumb for adding a new field:**

- If `app.config.js` reads it (anything that affects the native binary —
  bundle id, scheme, splash, icons, app extensions, entitlements) →
  `brand.js`, and add it to `BrandConfig` in `brands/types.d.ts`.
- Otherwise (anything the running JS app uses — feeds, links, palette,
  feature flags, PDS) → `brand.ts`, and add it to `Brand` in
  `src/brand/types.ts`.

The TypeScript type system enforces both contracts.

## Adding a brand

1. Copy `bluesky/` to `<your-brand>/`.
2. Edit `<your-brand>/brand.js` and `<your-brand>/brand.ts` with brand-specific
   values.
3. Register it in `src/brand/registry.ts`.
4. (Web) Map a hostname to the brand id in `src/brand/resolve.web.ts`.
5. (Native) Build with `EXPO_PUBLIC_BRAND=<your-brand> yarn ios`.

## Out of scope: community-only search and discover

The client cannot filter `app.bsky.unspecced.searchPosts` or the discover
feed to "members of our PDS" without either running a custom appview or
post-filtering results client-side (which breaks pagination and yields sparse
pages). What this layer can do:

- Swap the algorithmic pinned feed at signup (`brand.defaultFeeds`) — feed
  generators do their own server-side filtering.
- Route `brand.pds.appview` to a community-run appview when one exists.

Anything beyond that is appview work, not a brand-config change.
