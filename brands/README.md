# brands/

White-label configuration for community-specific deployments of the social
app. Each subdirectory is one brand. The directory name is the brand id used
by `EXPO_PUBLIC_BRAND` and by the hostname mapping in `src/brand/resolve.web.ts`.

## Files in a brand directory

- `brand.js` — CommonJS native-build identity (name, scheme, bundle id, app
  extensions, splash colors). Read by `app.config.js` at native build time.
- `brand.ts` — TypeScript runtime brand (PDS, default feeds, links, feature
  flags, palette). Read by `src/brand/registry.ts`.
- `assets/` — brand-specific icons, splash images, logos.

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
