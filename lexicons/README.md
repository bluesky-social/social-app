# Lexicons

Published schemas are fetched with `pnpm lexicons:update`; use a scoped manifest
to exclude `app.bsky.embed.external` (see below). `lexicons.json` pins each
published schema's URI and CID, and `pnpm lexicons:verify` checks the installed
files against it. Do not hand-edit published schemas.

Unpublished schemas, such as the `app.bsky.unspecced` ones, are plain files in
this directory and are not listed in `lexicons.json`. `pnpm lexicons:generate`
builds them like any other file.

## Local extension: `app.bsky.embed.external`

This schema is a copy of `lexicons/app/bsky/embed/external.json` from
[bluesky-social/bsky](https://github.com/bluesky-social/bsky) `main` at
`d92c6fe74100d33b5250f076b767e6bb8cea9026`, which is ahead of the published
schema record (it adds article and gallery `viewer` state, `providerId`,
`view.data`, `knownLikers`/`knownLikerCount`, and
`knownSubscribers`/`knownSubscriberCount`, among others). It is reformatted to
the installer's layout and omits the deprecated article and gallery `likers`
previews, which nothing reads and the appview no longer sends. Its manifest CID
is calculated from this file, not the published record CID. Exclude it from
scoped updates until the published schema includes these fields.

## Unpublished Atmosphere schemas

The `app.bsky.unspecced` namespace is intentionally unpublished (it is a DNS
carveout upstream, and resolving it is a CI violation there), so the installer
cannot fetch it. These schemas are files only, with no `lexicons.json` entry.
The `getAtmosphere*` schemas are copied from `lexicons/app/bsky/unspecced/` in
bluesky-social/bsky `main` at `d92c6fe74100d33b5250f076b767e6bb8cea9026`. Only
the schemas the app calls are copied; `getAtmosphereTimeline` (v1) is
intentionally omitted in favor of `getAtmosphereTimelineV2`.

Other `app.bsky.unspecced` schemas are not synced from bsky `main`: some there
lack fields the app uses (such as `recIdStr`) that atproto still adds through
`lexicons-overrides`.

To update one, copy the upstream JSON over the file. Don't add these schemas to
`lexicons.json`: the installer would try to fetch them from the network, and
`pnpm lexicons:update` fails when it can't.

The authenticated Activity timeline (`getAtmosphereTimelineV2`) uses the
session's appview client. Its feed contains activity items, actor groups, and
subject groups, with actor profiles in `relatedViews`. “View all” on an actor
group hydrates the subjects of the group's activities through
`getAtmosphereRecordViews`, 25 at a time. The Apps tab follows Explore;
Explore's app gallery opens it with “See more”.

## Exception: `place.stream.badge.defs`

`place.stream.livestream` reaches `place.stream.badge.defs` through
`place.stream.chat.defs`, but `_lexicon.badge.stream.place` has no TXT record,
so the installer cannot resolve it by NSID. It is pinned by AT URI from the
`did:plc` repo that publishes `place.stream.livestream`; its CID matches the copy
in the `did:web:stream.place` repo. Install it with
`pnpm lexicons:install at://did:plc:gqtagsooi75obldmytuow57q/com.atproto.lexicon.schema/place.stream.badge.defs`
when adding or refreshing `place.stream.*` schemas.
