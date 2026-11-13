# Lexicons

Published schemas are fetched with `pnpm lexicons:update`; use a scoped manifest
to exclude the locally maintained exceptions below. `lexicons.json` pins
each schema's URI and CID, and `pnpm lexicons:verify` checks the installed files
against it. Do not hand-edit published schemas.

## Local extension: `app.bsky.embed.external`

`viewGallery.photoCount` is an optional non-negative total photo count, distinct
from the number of hydrated gallery items. Upstream added it in atproto PR 5880
(`lexicons-overrides/app/bsky/embed/external.json` at
`e9fbdab8e2302e3e01ea923c2db5ee4d7ff33681`), which this schema matches, but the
published schema record does not include it yet. Its manifest CID is a locally
calculated content-integrity pin, not the published record CID. Exclude it from
scoped updates until the published schema includes the field.

## Unpublished Atmosphere schemas

The `app.bsky.unspecced` namespace is intentionally unpublished (it is a DNS
carveout upstream, and resolving it is a CI violation there), so the installer
cannot fetch it. These schemas are copied from merged upstream sources:

- `lexicons-overrides/app/bsky/unspecced/getAtmosphereExploreTab.json` at atproto
  `a704f10c040a989244cfa578e65f006ff7de0f83` (from atproto PR 5892)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereApps.json` at atproto
  `a704f10c040a989244cfa578e65f006ff7de0f83` (from atproto PR 5892)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereTimeline.json` at atproto
  `4ca55dbc6d9e04d721fc14abffb73ce33158e002` (from atproto PR 5871)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereRecordViews.json` at atproto
  `3fb2578a59813b3183fb1e443120e25a43ab4aba` (from atproto PR 5860)

In `lexicons.json`, their `cid` values are locally calculated content-integrity
pins, not published record CIDs, and their `uri` values are only installer
compatibility hints, not published record locations. An unscoped network update
will fail when it tries to fetch these schemas. Update them from upstream JSON
and compute each local CID with `cidForLex` from `@atproto/lex-cbor`.

The authenticated Activity timeline uses the session's appview client. Its feed
contains hydrated activity items, actor groups, and subject groups. Until the
timeline returns actor profiles, missing ones are fetched through
`app.bsky.actor.getProfiles` in batches of at most 25. “View all” on an actor
group hydrates the group's records through `getAtmosphereRecordViews`, 25 at a
time. The Apps tab follows Explore; Explore's app gallery opens it with “See more”.

## Exception: `place.stream.badge.defs`

`place.stream.livestream` reaches `place.stream.badge.defs` through
`place.stream.chat.defs`, but `_lexicon.badge.stream.place` has no TXT record,
so the installer cannot resolve it by NSID. It is pinned by AT URI from the
`did:plc` repo that publishes `place.stream.livestream`; its CID matches the copy
in the `did:web:stream.place` repo. Install it with
`pnpm lexicons:install at://did:plc:gqtagsooi75obldmytuow57q/com.atproto.lexicon.schema/place.stream.badge.defs`
when adding or refreshing `place.stream.*` schemas.
