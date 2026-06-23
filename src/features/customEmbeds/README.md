# Custom embeds

Fork-owned, client-side enhancement of external link embeds (`app.bsky.embed.external`).

Upstream renders external links as a plain card (`ExternalEmbed`) or, for
`standard.site` links, as a `StandardSiteEmbed`. That richer card relies on the
**appview** enriching the embed with `associatedRefs`/`source`. Our custom
embeds instead work **purely client-side**: we match on the link URL and fetch
everything ourselves, so they render even when the post was authored from the
vanilla Bluesky app (which never sets `associatedRefs`).

## How it plugs in

There is a single, additive touchpoint in upstream code: the top of the `link`
case in `src/components/Post/Embed/index.tsx` calls `matchCustomEmbed(view)`.
If a handler matches, its component renders; otherwise upstream's default
external embed rendering runs unchanged. Keeping the integration to one
clearly-marked block minimizes merge conflicts when syncing with upstream.

## Adding a new custom embed

1. Create a directory under `customEmbeds/` (e.g. `myEmbed/`).
2. Implement a `CustomEmbedHandler` (see `types.ts`): a `match(view)` predicate
   (usually a URL host check) and a `Component` rendering the card.
3. Register it in `registry.ts`. First match in the list wins.

## atmoRsvp

Renders [atmo.rsvp](https://atmo.rsvp) calendar events
(`community.lexicon.calendar.event`) with in-app RSVP.

- **Detect**: `https://atmo.rsvp/p/{handle}/e/{rkey}` (`detect.ts`).
- **Read**: atmo's public XRPC for event details + aggregate counts + attendee
  faces (`rsvp.atmo.event.getRecord`). Images are built as `cdn.bsky.app` URLs,
  matching how atmo serves them. The viewer's own RSVP status comes from atmo's
  `subjectUri`-filtered `rsvp.atmo.rsvp.listRecords` (a targeted lookup). The
  mutation writes the result into cache without invalidating, so the button
  stays correct during atmo's brief post-write indexing lag.
- **Write**: RSVPs are `community.lexicon.calendar.rsvp` records written
  directly to the user's repo via their agent. atmo indexes them off the
  firehose, so the aggregate going-count is updated optimistically and
  reconciles on the next refetch.

## tangledString

Renders [Tangled](https://tangled.org) "strings" (`sh.tangled.string`) - shared
code snippets/pastes - as a syntax-highlighted code card.

- **Detect**: `https://tangled.org/strings/{actor}/{rkey}` (also `tangled.sh`),
  where `{actor}` is a handle or DID (`detect.ts`).
- **Read**: the snippet text lives inline in the record, so a single
  `com.atproto.repo.getRecord` is all the card needs (`queries.ts`). The owner
  profile is fetched alongside it for the byline, best-effort.
- **Highlight**: `highlight.ts` runs the code through `lowlight` (highlight.js
  grammars, pure JS so it works on web and native) and flattens the result into
  lines of scoped spans; `CodeBlock.tsx` renders those into ALF-themed `Text`.
  The language is inferred from the filename extension, falling back to
  highlight.js auto-detection. Feed cards show a `PREVIEW_LINES` preview and
  link out for the rest.

> `lowlight` and its `devlop` dependency are ESM-only, so both are added to
> `transformIgnorePatterns` in `package.json` for Jest.
