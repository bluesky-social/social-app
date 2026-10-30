# Lexicons

Published schemas are fetched with `pnpm lexicons:update`; use a scoped manifest
to exclude the locally maintained exceptions below. `lexicons.json` pins
each schema's URI and CID, and `pnpm lexicons:verify` checks the installed files
against it. Do not hand-edit published schemas.

## Local extension: `app.bsky.embed.external`

`viewGallery.photoCount` is an optional non-negative total photo count, distinct
from the number of hydrated gallery items. This schema includes that local
extension; its manifest CID is a locally calculated content-integrity pin, not
the published record CID. Exclude it from scoped updates until the published
schema includes the field.

## Unpublished Atmosphere schemas

The `app.bsky.unspecced` namespace is intentionally unpublished (it is a DNS
carveout upstream, and resolving it is a CI violation there), so the installer
cannot fetch it. These schemas are copied from merged upstream sources:

- `lexicons-overrides/app/bsky/unspecced/getAtmosphereExploreTab.json` at atproto
  `7b640e8fee709d22a0d62262068db0ddb3106741` (from atproto PR 5809)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereApps.json` at atproto
  `11f52c5588279d159ab12404a1b323731a467fdd` (from atproto PR 5801)
- [`getAtmosphereTimeline` at `15aacf4299dc`](https://github.com/bluesky-social/atproto/blob/15aacf4299dc84a650d906e3aa6e82bde1b828d8/lexicons-overrides/app/bsky/unspecced/getAtmosphereTimeline.json)

In `lexicons.json`, their `cid` values are locally calculated content-integrity
pins, not published record CIDs, and their `uri` values are only installer
compatibility hints, not published record locations. An unscoped network update
will fail when it tries to fetch these schemas. Update them from upstream JSON
and compute each local CID with `cidForLex` from `@atproto/lex-cbor`.

The authenticated Activity timeline uses the session's appview client. Its feed
contains hydrated activities, page-local groups, and overflow counts; it has no
raw-record sidecars or separate raw endpoint. Missing interaction-owner profiles
are fetched through `app.bsky.actor.getProfiles` in batches of at most 25. The Raw
tab inspects the original timeline entries from the same account-scoped query.

## Exception: `place.stream.badge.defs`

`place.stream.livestream` reaches `place.stream.badge.defs` through
`place.stream.chat.defs`, but `_lexicon.badge.stream.place` has no TXT record,
so the installer cannot resolve it by NSID. It is pinned by AT URI from the
`did:plc` repo that publishes `place.stream.livestream`; its CID matches the copy
in the `did:web:stream.place` repo. Install it with
`pnpm lexicons:install at://did:plc:gqtagsooi75obldmytuow57q/com.atproto.lexicon.schema/place.stream.badge.defs`
when adding or refreshing `place.stream.*` schemas.
