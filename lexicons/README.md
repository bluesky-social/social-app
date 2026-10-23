# Lexicons

Published schemas are fetched with `pnpm lexicons:update`; use a scoped manifest
to exclude the unpublished exception below. `lexicons.json` pins each schema's
URI and CID, and `pnpm lexicons:verify` checks the installed files against it.
Do not hand-edit published schemas.

## Exception: `app.bsky.unspecced.getAtmosphereExploreTab`

The `app.bsky.unspecced` namespace is intentionally unpublished (it is a DNS
carveout upstream, and resolving it is a CI violation there), so the installer
cannot fetch it. Its schema is copied from the merged upstream source,
[`lexicons/app/bsky/unspecced/getAtmosphereExploreTab.json` at `293d6494ed90`](https://github.com/bluesky-social/bsky/blob/293d6494ed9058e28a04b97133d16ab8abe7ef5e/lexicons/app/bsky/unspecced/getAtmosphereExploreTab.json).

In `lexicons.json`, its `cid` is a locally calculated content-integrity pin, not
a published record CID, and its `uri` is only an installer compatibility hint,
not a published record location. An unscoped network update will fail when it
tries to fetch this schema. Update it from upstream JSON and compute its local
CID with `cidForLex` from `@atproto/lex-cbor`.
