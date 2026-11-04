# Lexicons

Published schemas are fetched with `pnpm lexicons:update`; use a scoped manifest
to exclude the unpublished exception below. `lexicons.json` pins each schema's
URI and CID, and `pnpm lexicons:verify` checks the installed files against it.
Do not hand-edit published schemas.

## Exceptions: `app.bsky.unspecced.getAtmosphereExploreTab` and `getAtmosphereApps`

The `app.bsky.unspecced` namespace is intentionally unpublished (it is a DNS
carveout upstream, and resolving it is a CI violation there), so the installer
cannot fetch it. These schemas are copied from merged upstream sources:

- [`lexicons/app/bsky/unspecced/getAtmosphereExploreTab.json` at `293d6494ed90`](https://github.com/bluesky-social/bsky/blob/293d6494ed9058e28a04b97133d16ab8abe7ef5e/lexicons/app/bsky/unspecced/getAtmosphereExploreTab.json)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereApps.json` at atproto
  `11f52c5588279d159ab12404a1b323731a467fdd` (from atproto PR 5801)

In `lexicons.json`, their `cid` values are locally calculated content-integrity
pins, not published record CIDs, and their `uri` values are only installer
compatibility hints, not published record locations. An unscoped network update
will fail when it tries to fetch these schemas. Update them from upstream JSON
and compute each local CID with `cidForLex` from `@atproto/lex-cbor`.

## Exception: `place.stream.badge.defs`

`place.stream.livestream` reaches `place.stream.badge.defs` through
`place.stream.chat.defs`, but `_lexicon.badge.stream.place` has no TXT record,
so the installer cannot resolve it by NSID. It is pinned by AT URI from the
`did:plc` repo that publishes `place.stream.livestream`; its CID matches the copy
in the `did:web:stream.place` repo. Install it with
`pnpm lexicons:install at://did:plc:gqtagsooi75obldmytuow57q/com.atproto.lexicon.schema/place.stream.badge.defs`
when adding or refreshing `place.stream.*` schemas.
