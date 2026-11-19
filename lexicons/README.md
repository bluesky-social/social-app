# Lexicons

Published schemas are fetched with `pnpm lexicons:update`; use a scoped manifest
to exclude `app.bsky.embed.external` (see below). `lexicons.json` pins each
published schema's URI and CID, and `pnpm lexicons:verify` checks the installed
files against it. Do not hand-edit published schemas.

Unpublished schemas, such as the `app.bsky.unspecced` ones, are plain files in
this directory and are not listed in `lexicons.json`. `pnpm lexicons:generate`
builds them like any other file.

## Local extension: `app.bsky.embed.external`

This schema matches upstream `lexicons-overrides/app/bsky/embed/external.json`
at atproto `f0653de696169e16dc003f11877b9eb0ae6533c0`, which is ahead of the
published schema record: it adds `viewGallery.photoCount` (atproto PR 5880),
plus `viewLivestream.lastSeenAt` and `viewArticlePublication.viewer` (atproto PR
5893). Its manifest CID is a locally calculated content-integrity pin, not the
published record CID. Exclude it from scoped updates until the published schema
includes these fields.

## Local extension: `tools.ozone.inbox.getReport`

The schema matches the version in atproto commit
`57ac20d8f387707e66fc88cdf57ff88b76678331` (PR 5947), adding the optional
`accountStatus` and `subjectStatus` fields. As of 2026-11-19 the published
record does not include them. The manifest CID is a locally calculated
content-integrity pin, not the published record CID. Exclude this schema from
updates until the published record includes the fields, then replace the local
copy and pin with the published version.

## Unpublished Atmosphere schemas

The `app.bsky.unspecced` namespace is intentionally unpublished (it is a DNS
carveout upstream, and resolving it is a CI violation there), so the installer
cannot fetch it. These schemas are files only, with no `lexicons.json` entry,
and are copied from merged upstream sources:

- `lexicons-overrides/app/bsky/unspecced/getAtmosphereExploreTab.json` at atproto
  `a704f10c040a989244cfa578e65f006ff7de0f83` (from atproto PR 5892)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereApps.json` at atproto
  `a704f10c040a989244cfa578e65f006ff7de0f83` (from atproto PR 5892)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereTimelineV2.json` at atproto
  `f0653de696169e16dc003f11877b9eb0ae6533c0` (from atproto PR 5893)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereRecordViews.json` at atproto
  `3fb2578a59813b3183fb1e443120e25a43ab4aba` (from atproto PR 5860)
- `lexicons-overrides/app/bsky/unspecced/getAtmosphereRecommendedActivity.json`
  at atproto `156b4a4ed722d02f0f30f8ab9a00aa366c74782c` (from atproto PR 5899)

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
