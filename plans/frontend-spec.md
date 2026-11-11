# Atmosphere screen frontend specification

Status: implemented in `src/screens/Atmosphere/` against `app.bsky.unspecced.getAtmosphereTimeline`. The current contract below supersedes conflicting historical proposals here and in [`atmosphere-social-proof-design.md`](./atmosphere-social-proof-design.md). That design history retains earlier verification evidence and manual-QA limitations.

The current wire schema is pinned from [atproto commit `4ca55bdc6d9e04d721fc14abffb73ce33158e002`](https://github.com/bluesky-social/atproto/blob/4ca55bdc6d9e04d721fc14abffb73ce33158e002/lexicons-overrides/app/bsky/unspecced/getAtmosphereTimeline.json). [`atmosphere-api-contract.md`](./atmosphere-api-contract.md) preserves the earlier sandbox contract, not the current frontend transport.

The primary implementation is now `src/screens/Atmosphere/`, renamed from Activity V2. It replaces the original Activity screen and uses the authenticated `Atmosphere` route at `/atmosphere`. The prototype rendering details below predate that replacement.

## Goal

Add an authenticated **Atmosphere** screen that displays the signed-in user's Atmosphere activity as a paginated list. Add entry points named **Atmosphere** to the mobile drawer and desktop left navigation.

Render a virtualized chronological stream of content-first cards and quiet footnotes. Keep backend order and grouping rather than regrouping repeated subjects across pages. Render the supplied hydrated item or shared subject; never reconstruct missing content from raw-record maps or URI-only members.


## Current presentation contract

| Collection                            | Presentation                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documents/recommendations             | Reuse the standard.site post embed for every usable hydrated article, including single recommendations and unsubscribed documents. Feature its supplied cover above the title and description, retain the publication footer and external CTA, and place supplied like counts inside the card. Keep related proof below. Unavailable content stays a compact fallback; actor groups keep the first article plus count. |
| Subscriptions                         | Every usable hydrated publication renders the shared post-embed publication card below the "Name subscribed to a new blog site · elapsed time" header, including single-person subscriptions. Actor groups keep the first publication plus a remainder count. Unavailable or unpinned targets stay compact. CTA uses the existing publisher-aware external-link path, not an account mutation.                         |
| Raw document shares                   | Hydrated standalone posts retain original text/facets and one compact document preview. Subject groups use their shared preview and reference-only post links, expandable beyond two initial links. Related share buckets stay separate from recommendation proof on their parent article. Never invent text, facets, or metrics for unhydrated references. |
| Streams                               | Safely linked active, ended, and grouped streams use cards with a full-width 16:9 preview above the title. The served `active` flag controls the live badge. Ended streams with valid ordered supplied dates say "Name streamed for N minutes", using whole minutes; grouped duration belongs to the first stream. Missing thumbnails are omitted, and missing/unsafe targets retain a compact fallback.               |
| Grain photos                          | Reuse the post ImageEmbed renderer: constrained single images, grids for two to four images, and the shared carousel for five to ten. Keep title and description in a compact text section, with larger like totals on the title row's right. No "via Grain" attribution. First ten usable photos in API order, with original alt and safe dimensions. Original group counts and sidecars remain intact.               |
| Publication roots/unknown collections | Retained publication creation rendering or generic compact activity fallback. No diagnostic colored rails.                                                                                                                                                                                                                                                                                                             |

Use hydrated usable actors, never DID placeholders or invented friends/counts. Keep original related buckets, sidecar references, and item/group keys. Only normalized actor references and the rendered target's subscription state belong in `computedItemView`; content and transient timeline layout are resolved separately.

### Timeline response contract

- Generate the client from `lexicons/app/bsky/unspecced/getAtmosphereTimeline.json`; request through the authenticated appview client, with opaque cursors unchanged.
- Feed entries are `activityItem`, `activityActorGroup`, or `activitySubjectGroup`. There is no legacy `activityGroup`, `groupBy`/`items` payload, or `activityItemOverflow` row.
- Actor groups supply one newest hydrated `item` and the complete ordered `uris` list. Counts come from that list; only the supplied item provides media, publication/article content, viewer state, and post actions. If pagination has already displayed that item, omit the group instead of promoting an unhydrated older URI.
- Subject groups supply one hydrated `subject`, ordered actor profiles, and reference-only `activities`. Resolve content and subscription state from the subject, not the first reference. A reference is not a post view or a complete activity item.
- `relatedActivity` is an array of per-collection buckets containing actor profiles and activity references. Use the supplied profiles and references for document proof; do not manufacture nested hydrated activities.
- Deduplicate record URIs across pages without changing backend order or regrouping subjects. Preserve the original group for raw-response inspection when visible members are deduplicated; keep outer group timestamps and stable IDs.
- Reuse profiles embedded in groups, related buckets, associated content, and `viewBskyPost.author`. Hydrate only missing interaction owners with bounded profile batches, preserving supplied profile objects.
- Shared subjects can provide `bskyPostRef` and `viewBskyPost`. An explicitly associated hydrated post can have a newer CID than its declared reference when its URI matches; use its actual CID for cached reporting while retaining the original API JSON. Native shares retain their own pinned record CID and require exact URI/CID matching for cached views.


### Feed and notification alignment

- Match feed posts and Notifications v2 with a fixed 42px primary avatar column, an 18px leading inset, and a 12px avatar/content gap. Cards, previews, and compact-row text share the resulting 72px content inset.
- Place the activity-kind icon in a 20px badge overlapping the avatar's lower end corner, separated by a 2px ring in the current background color. Do not insert the primary action icon between an avatar and its text.
- Use ALF `text_md` for primary actor/action sentences, descriptions, and shared-post text; reserve `text_sm` for handles, timestamps, and supporting source/byline metadata. Article typography follows the shared standard.site embed. Preserve responsive type sizing and the user's font settings.
- Use moderated, sanitized display names in actor sentences and author bylines, falling back to the sanitized handle when the name is empty or hidden. Put the linked handle in muted subtext below the line containing the display name.
- Keep the primary actor separate from the remaining grouped actors, whose bounded avatar stack sits above the sentence in the content column. Group counts and API order are unchanged.
- Show the actor/action header above a card rather than burying the primary actor in its footer. Feature-owned cards use the normal theme background, medium corner radius, and a low-contrast border. Stream media meet the card's top and side borders; only the text below gets 16px padding. Grain cards reuse the shared post image renderer and contain its gallery bleed within the card; their text section has 12px horizontal padding, 8px vertical padding, and a 4px title/description gap. Article cards reuse the shared embed's styling.
- Article card headers say "Name recommended an article" or "Name published a new article". Compact unavailable-content fallbacks retain the verb followed by the title.
- Generic standard.site document CTAs say "Read now" and open the document, including on long press. Publication cards retain "View publication", and recognized publishers retain their subscription CTAs.
- Supporting publication/share thumbnails retain a 60px trailing slot; article and stream images are featured media, not trailing thumbnails. Long handles, source names, and titles must wrap or truncate inside their content column without covering a badge, menu, or image. Profile, document, publication, and media interactions retain their independent targets.
- Put the ellipsis in the top-right of the actor/action header, outside the content card, without a separate Bluesky butterfly button. Offer "View Bluesky post" when the rendered item or shared subject has a usable post reference, prioritizing its explicit `bskyPostRef` over its own post record, directly hydrated post view, or external associated post references. For a share subject group without an associated post, use its first actual share reference. Navigate to the in-app post page using the referenced DID and record key. Omit the action when no usable post is available. Never borrow a later member's post, related share, quote, article URL, or publication reference.
- The ellipsis reuses the post control button and icon styling, plus the existing account mutation queues and profile shadows for mute/unmute and confirmed block/unblock, targeting the primary activity actor. Respect self-account and moderation-list restrictions. Register cached Atmosphere actors with the shared shadow cache so optimistic changes and rollbacks update the menu.
- Report the actual associated post, fetching its full view on demand when only a strong reference exists. Reuse explicit `viewBskyPost` with a matching URI and its own valid CID, including newer hydration of the declared associated post. Other cached views and on-demand lookups require exact URI/CID matching. Require a supported post record; show a visible load error rather than inventing a post or silently falling back to an account report. Activities without an associated post offer account reporting instead. Reuse sign-in gating and the native menu/dialog close sequencing.
- Keep Activity, Explore, and Apps tabs, without a Raw tab. Each activity's ellipsis includes the diagnostic "View raw response" action, including for own-account rows. Open a scrollable dialog with selectable, indented JSON for the original API activity or group, retaining all URI-only members, actor profiles, reference-only activities, and shared subjects even when the timeline deduplicates them. Serialize only while the dialog is open; leave moderation restrictions unchanged.
- Show available hydrated article recommendation and Grain gallery like totals with a heart icon, and publication subscription totals with a bookmark/subscription icon. Grain likes use a larger icon and semibold count at the right of the title bar. Article publisher subscription totals remain distinct from article recommendation totals. Reuse localized compact number formatting and full-count accessible labels; preserve explicit zeroes and omit missing totals. Never infer totals from bounded liker/subscriber previews, related activity, or group size, and do not duplicate Bluesky post metrics.

### Timeline

- Use outer item/group `indexedAt` for heading placement. The rolling last three hours are unheaded, even across midnight; remaining local-today rows use **Earlier today**, yesterday uses **Yesterday**, and older rows use a Lingui-localized full date.
- Invalid timestamps create no heading; future timestamps remain unheaded. Recompute on the shared minute tick and app resume. Locale changes update translated headings/date formatting.
- Timeline rows own inter-row spacing, without extra renderer margins. Compact-run separators start at the content inset. A heading belongs to its first visible row; suppressed rows leave no orphan heading or gap. Each group stays one virtualized row, not an unbounded nested list.
- Give rows more breathing room: 24px before the first row, 40px before a new date bucket, 32px between rows involving a card, and 28px between compact rows. Avatar/content stacks use a 12px gap; grouped share snippets use 16px separation.
- Preserve loading/empty/error/retry, pull-to-refresh, next-page guards/footer, and account-scoped query caches. Opaque cursors pass through unchanged.
- Web-only `?debug` remains one object-log control per outer row, with reference-preserving reachable sidecars. No native debug button.

The detailed implementation proposals below, including their sandbox transport, generated schema, raw-record maps, and earlier threshold/card proposals, are historical where they conflict with this contract. In particular, subscriber thresholds, recommendation-count promotion, target-author-follow promotion, ended-stream footnotes, colored diagnostic borders, and DID identity fallbacks are not current behavior. The frontend does not support the legacy wire shapes alongside the current schema.

## Scope

This work includes:

- the `eric.bsky.atmosphere.getActivity` lexicon and generated client schema;
- an appview-sandbox client in the session bundle;
- a camelCase React Query module;
- a new authenticated route and screen;
- a drawer item and desktop left-navigation item;
- loading, empty, error, refresh, and pagination states;
- basic rows for the configured record collections plus qualifying `app.bsky.feed.post` document shares;
- inline rendering for Grain photo records;
- linked actor handles, documents, and publications;
- defensive rendering for missing or malformed associated records and actors.

This work does not include:

- an Atmosphere bottom-tab item;
- full article rendering;
- interactions that create, delete, or update Atmosphere records;
- a detail screen for Activity rows;
- persisted query data or live timeline subscriptions; account moderation shadows still update immediately.

## Transport and generated schema

### Lexicon

Copy the backend lexicon byte-for-byte from:

```text
/Users/eric/sites/bluesky/appview-sandbox-worktrees/atmosphere-tab/lexicons/eric/bsky/atmosphere/getActivity.json
```

into:

```text
lexicons/eric/bsky/atmosphere/getActivity.json
```

Run:

```sh
pnpm lexicons:generate
```

Do not run the internationalization extraction or compilation commands.

The generated namespace should be imported through `#/lexicons`. The endpoint's `associatedRecords` and `actors` properties are generated as `unknown`; narrow them at the query boundary before screen code consumes them.

### Appview-sandbox client

Add a dedicated appview-sandbox client to the session bundle, following the existing `chatClient` structure and the canonical appview-sandbox client integration:

- add an `appviewSandboxClient: Client` member to authenticated and public session bundles;
- add a `buildAppviewSandboxClient()` factory in `src/state/session/clients.ts`;
- construct it with the other clients in `buildBundle()` and keep its direct-local transport on the bundle lifecycle's kill-switched fetch;
- expose strict and nullable hooks as `useAppviewSandboxClient()` and `useMaybeAppviewSandboxClient()` from `src/state/session/index.tsx`;
- use the shared unauthenticated throwing client in the public bundle;
- apply cached account labeler subscriptions because sandbox responses contain hydrated Bluesky profile views;
- update session test fixtures and client/bundle/moderation tests to include it.

Service behavior:

- When `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` is unset, use the signed-in session and proxy through the PDS to:

  ```text
  did:web:appview-sandbox.k1.prod.bsky.dev#bsky_appviewSandbox
  ```

- When `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` is set, send requests directly to that origin, do not set an `atproto-proxy` header, and send the signed-in actor DID as the raw authorization value accepted by appview-sandbox development mode. Tandem local development uses `http://localhost:3000` in the uncommitted `.env.local`.
- When Expo web is accessed through a public tunnel, set `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` to a public HTTPS tunnel for backend port 3000 and restart Expo. Do not expose PostgreSQL or the Node inspector, and do not leave the development raw-DID endpoint publicly unprotected.
- Add an empty, documented `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` entry to `.env.example` and expose the value through `#/env`.
- The endpoint and screen are authenticated. The backend derives the viewer from auth; the client must not send caller-selected viewer input.

## Data model and narrowing

Define feature-local structural types in the camelCase query module. They should describe only fields this screen reads.

```ts
type ActivityView =
  | {
      $type: 'eric.bsky.atmosphere.getActivity#livestreamView'
      thumb?: string
    }
  | {$type: 'eric.bsky.atmosphere.getActivity#longformView'}
  | {$type: 'eric.bsky.atmosphere.getActivity#photoView'}
  | {$type: 'eric.bsky.atmosphere.getActivity#recommendationView'}
  | {$type: 'eric.bsky.atmosphere.getActivity#subscriptionView'}
  | {
      $type: 'eric.bsky.atmosphere.getActivity#shareView'
      likeCount: number
      replyCount: number
      repostCount: number
      quoteCount: number
      bookmarkCount: number
    }

type ActivityItem = {
  $type: 'eric.bsky.atmosphere.getActivity#item'
  record: {
    uri: string
    cid: string
    indexedAt: string
  }
  collection: string
  viewerState: {
    subscribed: boolean
  }
  view?: ActivityView
  relatedActivity?: ActivityItem[]
}

type ActivityGroup = {
  $type: 'eric.bsky.atmosphere.getActivity#group'
  id: string
  groupBy: 'subject' | 'actor'
  collection: string
  indexedAt: string
  subject?: string
  actor?: string
  items: ActivityItem[]
}

type ActivityFeedEntry = ActivityItem | ActivityGroup

type AssociatedRecord = {
  uri: string
  cid: string
  record: {
    $type?: string
    [key: string]: unknown
  }
}

type AssociatedRecords = Record<string, AssociatedRecord>

type ActivityActor = {
  did: string
  handle: string
  displayName?: string
  pronouns?: string
  avatar?: string
  createdAt?: string
}

type ActivityActors = Record<string, ActivityActor>

type AtmosphereActivityPage = {
  feed: ActivityFeedEntry[]
  associatedRecords: AssociatedRecords
  actors: ActivityActors
  cursor?: string
}

### Grouping timing contract

Grouping is computed by the backend after root pagination and is page-local. Root pagination uses the same age-tier windows for adjacent gap boundaries, preventing its normal gap boundary from splitting a possible group; the 200-root cap can still split one. Each candidate cluster uses one fixed request timestamp and an anchor-based maximum span; it never chains through adjacent events. An anchor younger than one hour uses an inclusive 30-minute span. An anchor at least one hour old and no more than 12 hours old uses an inclusive 1-hour span. An anchor more than 12 hours old and no more than 24 hours old uses an inclusive 4-hour span. An anchor more than 24 hours old uses an inclusive 8-hour span. Exactly 12 hours uses the 1-hour tier, and exactly 24 hours uses the 4-hour tier. The frontend must preserve the API-provided group and child order and must not regroup entries across pages. The backend always leaves an active `place.stream.livestream` record without `endedAt` as a standalone item; only ended livestreams may appear in actor groups. Post shares never actor-group: shares of the same document may arrive as a subject group, while shares of different documents remain separate rows even when authored by one actor.

Before pagination, the backend collapses duplicate recommendations from one actor to one document, duplicate subscriptions from one actor to one publication, and duplicate post shares from one actor to one external associated document into one logical activity. After selecting a page and hydrating associated records, it removes roots whose render-required chain is incomplete before grouping. Recommendations and post shares require their document and its AT-URI publication; subscriptions require their publication; documents require an AT-URI publication when `site` uses one. Group counts already exclude omitted roots, and a would-be two-item group may arrive as one standalone item. It preserves records from different actors. The earliest active source URI represents the action; if that record is deleted, a remaining duplicate may replace its URI and timestamp. This does not change the response type. Do not add client-side actor/target deduplication, because it would operate too late for correct pagination.
```

Add narrow field guards for the records used by row presentation:

```ts
type DocumentRecord = {
  $type?: 'site.standard.document'
  site: string
  title: string
  textContent?: string
  publishedAt: string
}

type PublicationRecord = {
  $type?: 'site.standard.publication'
  name: string
  url: string
}

type RecommendRecord = {
  $type?: 'site.standard.graph.recommend'
  document: string
  createdAt: string
}

type SubscriptionRecord = {
  $type?: 'site.standard.graph.subscription'
  publication: string
  createdAt?: string
}

type PostRecord = {
  $type?: 'app.bsky.feed.post'
  text: string
  facets?: unknown[]
  embed?: unknown
  langs?: string[]
  labels?: unknown
  tags?: string[]
  createdAt: string
  [key: string]: unknown
}

type LivestreamRecord = {
  $type?: 'place.stream.livestream'
  title?: string
  createdAt: string
  endedAt?: string
}

type GrainPhotoRecord = {
  $type?: 'social.grain.photo'
  alt?: string
  photo: {
    ref: unknown
    mimeType: string
  }
  aspectRatio?: {
    width: number
    height: number
  }
}
```

Narrowing rules:

- Treat non-object `associatedRecords` and `actors` values as empty maps rather than casting blindly.
- Ignore malformed individual map entries during lookup, but do not remove their corresponding feed entry from the list.
- Discriminate entries by `$type`; groups contain only direct `ActivityItem` children and have at least two children.
- Treat `activity.collection` as a required sibling of `activity.record` on standalone items and direct group children.
- Narrow `view` by its `$type` discriminator. Preserve unknown typed variants defensively. The backend currently emits `#livestreamView` and `#shareView`; the other declared variants are empty extension points for later view hydration.
- A livestream view's optional `thumb` is already a complete `feed_thumbnail` CDN URL. Use it directly; do not reconstruct it from the raw record blob.
- A document item may contain `relatedActivity`, a reverse-chronological list of recommendation or post-share items targeting that document. Preserve it on standalone documents and document group children, never flatten it into the outer feed, and discard nested `relatedActivity` defensively.
- A post share's complete raw `app.bsky.feed.post` record is at `associatedRecords[item.record.uri].record`. It is not a hydrated `PostView`; preserve unknown post fields during narrowing. Read like, reply, repost, quote, and bookmark counts from the required nonnegative fields on that item's `#shareView`, not from the raw record.
- Treat every child `activity.record` as metadata only; resolve the raw root payload through `associatedRecords[activity.record.uri].record`.
- Preserve `activity.collection` and `activity.viewerState.subscribed` when narrowing each child item.
- For `groupBy: 'subject'`, expect `subject` and no `actor`; for `groupBy: 'actor'`, expect `actor` and no `subject`.
- Use `group.indexedAt` for group-level elapsed time; child rows use their own `record.indexedAt`.
- Use `activity.collection` as the primary standalone row discriminator and confirm that required record fields have the expected primitive types before reading them.
- Use `AtUri` from `@atproto/syntax` only for URI authority or other URI-property parsing, not to re-derive the root record collection.
- Catch invalid AT URIs and render the generic fallback row.

## React Query hook

Create the camelCase file:

```text
src/screens/Atmosphere/query.ts
```

Export:

```ts
useAtmosphereQuery()
```

The hook:

- reads `currentAccount.did` from `useSession()`;
- reads the dedicated client from `useAppviewSandboxClient()`;
- builds its key with `createQueryKey()` and an object containing the current account DID so caches stay account-scoped;
- calls `eric.bsky.atmosphere.getActivity` with only `cursor: pageParam` when present; session authentication determines the viewer;
- does not send a limit; page sizing is server-controlled over candidate roots; the backend selects at least 10 candidates when available, extends through age-tier activity bursts, and caps a page at 200 candidates; required-association filtering and grouping can make the returned feed shorter, and the cursor still advances past omitted candidates;
- uses `useInfiniteQuery`;
- sets `initialPageParam` to `undefined as string | undefined`;
- returns `lastPage.cursor` from `getNextPageParam`;
- narrows each response to `AtmosphereActivityPage` in the query function;
- uses `STALE.SECONDS.FIFTEEN`;
- does not persist the query.

An absent response cursor means there is no next page. The client must never parse or construct a cursor.

## Screen and list

Create:

```text
src/screens/Atmosphere/index.tsx
```

Export `AtmosphereScreen`, typed as a `NativeStackScreenProps<CommonNavigatorParams, 'Atmosphere'>` screen.

Use the standard layout components:

```tsx
<Layout.Screen testID="atmosphereScreen">
  <Layout.Header.Outer>
    <Layout.Header.BackButton />
    <Layout.Header.Content>
      <Layout.Header.TitleText>
        <Trans>Atmosphere</Trans>
      </Layout.Header.TitleText>
    </Layout.Header.Content>
    <Layout.Header.Slot />
  </Layout.Header.Outer>
  {/* list */}
</Layout.Screen>
```

Use the app's shared `List` component for virtualization, pull-to-refresh, and pagination. Follow the established Bookmarks screen list behavior:

- preserve API feed order across pages;
- defensively deduplicate root activity URIs across loaded pages, keeping the first occurrence; preserve each group's child list and do not render group children as additional top-level list entries;
- fetch the next page from `onEndReached` only when a next page exists and no next-page request is active;
- use `ListFooter` for next-page loading, failure, and retry;
- show an initial loading placeholder;
- show an initial error state with the cleaned error and a retry action;
- show a translated empty state when a successful response contains no feed items;
- support pull-to-refresh independently from next-page loading.

### Prepared row data

Build the list model from all loaded pages:

1. Merge every page's `associatedRecords` into one `AssociatedRecords` object.
2. Merge every page's `actors` into one `ActivityActors` object.
3. Preserve each page's outer `feed` order, deduplicate root URIs across standalone items and group children, and retain the group entry as the list row for grouped roots.
4. Construct every row with references to the same merged maps:

```ts
type ActivityRowItem = {
  key: string
  activity: ActivityFeedEntry
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}
```

Do not copy or reduce `associatedRecords` per row. The row must receive the full merged map so it can traverse any relationship available in the loaded response data.

The merged maps may be rebuilt when query data changes; all rows produced by one list-model calculation must share those map references.

## Historical row presentation (superseded)

Every top-level feed entry must produce a visually separate row, including unsupported or malformed items. Standalone items use their root activity presentation. A document’s `relatedActivity` renders inside that document row below its body and above its footer. Recommendation children may keep the existing collapsed recommender row. Post-share children should produce a separate share summary using their raw post records, hydrated actors, and `#shareView` interaction counts, with copy equivalent to `@<handle> [and <n> others] shared`; do not label shares as recommendations. Collapse the related recommendations into one secondary row per document: an `AvatarStack` of up to five unique hydrated recommender profiles at 16px, followed by `text_xs` copy in the form `@<handle> [and <n> others] recommended`. Count all remaining usable actors even when the stack is capped at five, preserve related-activity order, drop unknown actors, and omit the secondary row when no usable related actor remains. A valid standalone `site.standard.document` adds a full `StandardSiteEmbed` beneath its activity header; if view construction fails, the activity sentence and defensive row remain. Subject groups use the collapsed and expandable presentation below. Actor recommendation, document, and subscription groups use their compact presentations below. Other actor groups remain in the diagnostic phase: render each direct child inside one container in API-provided reverse-chronological order and give that container a two-pixel red border. Group children are not recursively rendered as groups. Rows use standard ALF atoms and theme values:

- horizontal and vertical padding consistent with other feed rows;
- a bottom or top separator using `t.atoms.border_contrast_low`;
- the root actor's avatar when `actors[rootDid].avatar` is available;
- an avatar placeholder when the actor or avatar is unavailable;
- translated sentence text;
- `TimeElapsed` using `group.indexedAt` for a group and `activity.record.indexedAt` for an item;
- `emoji` on text that can contain actor or record-provided values.

For grouped activity, preserve every child item's viewer state and resolve each child's raw root record and actor from the shared sidecars. A subject group may summarize multiple actors targeting one document or publication. For `app.bsky.feed.post`, use copy equivalent to “Eric and 5 others shared Alice’s article,” resolve the article from `group.subject`, and retain each child’s complete post record for expanded rendering. Other subject groups retain their collection-specific summaries. An actor group may summarize one actor's activity in one collection. The opaque `group.id` is a list key only and must not be parsed.

### Actor document group: one actor, many documents

For a top-level `groupBy: "actor"` group whose collection is `site.standard.document`, render one actor summary with a 40px avatar, sanitized linked handle, and a translated pluralized sentence such as `@alice.mosphere.at published 2 posts`. Use `group.indexedAt` for the elapsed time and do not make the outer row pressable. Construct each child document view directly from `activity.record.uri` and the complete shared sidecars. Render the first two children with `StandardSiteCompactDocumentCard`, indented by `40px + tokens.space.md`; for more children, the same independent See more/See less button expands only this group. Actor links, document cards, the summary, and surrounding whitespace do not toggle expansion. Keep malformed children represented by the compact card's unavailable state without changing the API-provided summary count or order.

### Actor recommendation group: one actor, many documents

For a top-level `groupBy: "actor"` group whose collection is `site.standard.graph.recommend`, render one outer row with the actor from `group.actor`, a 40px leading avatar, and a sanitized `@handle` summary:

```text
@brookie.blog recommended 3 posts
```

Use Lingui pluralization with `group.items.length`, including the singular form defensively. Render the group's elapsed timestamp beside the summary without changing the count. Do not wrap the summary or surrounding row in a pressable; the actor link remains an independent profile link.

Resolve each child through the complete shared sidecars (`recommend -> document -> publication`) and construct its external view with `createActivitySubjectView`. Preserve API order, render at most the first two views initially, and use one shared indent of `40px + tokens.space.md` for the document list. The backend omits children whose configured record chain failed to hydrate, so ordinary missing document/publication cases must not produce **Post unavailable**. Keep the non-linking compact fallback only as defensive handling for malformed or contract-violating responses; do not include fallback rows in any independently calculated count. The compact document component is `StandardSiteCompactDocumentCard` at `src/components/Post/Embed/StandardSiteEmbed/StandardSiteCompactDocumentCard.tsx`. It renders a contained card with a publication header, a 16:9 document thumbnail or neutral placeholder, two-line title and description clamps, and a muted metadata row using `StandardSiteMetaRow`. A valid view makes the entire card a canonical document link; malformed or unavailable views remain non-linking placeholders. It does not use the standalone embed or publication subscribe control.

For more than two children, render a shared Button labeled **See more** after the second row. Only this button expands the local group state; it then becomes **See less**, which restores the two-row collapsed state. Compact document links, the actor profile link, the summary, and surrounding whitespace do not expand the group. Keep the opaque `group.id` as the outer list key.

### Actor subscription group: one actor, many publications

For a top-level `groupBy: "actor"` group whose collection is `site.standard.graph.subscription`, render one outer row with the actor from `group.actor`, a 40px leading avatar, and a sanitized `@handle` summary:

```text
@brookie.blog subscribed to 3 publications
```

Use Lingui pluralization with `group.items.length`, including the singular form defensively. Render the group's elapsed timestamp beside the summary. Do not wrap the summary or surrounding row in a pressable; the actor link remains an independent profile link.

Resolve each child through the complete shared sidecars (`subscription -> publication`) and construct its external view with `createActivitySubjectView`. Preserve API order, render at most the first two publication views initially, and use one shared indent of `40px + tokens.space.md` for the publication list. Render valid views with the existing `PublicationCard` and its normal publication theme handling. For more than two children, render an independent Button labeled **See more** after the second card. Only this button expands the local group state; it then becomes **See less**, which restores the two-card collapsed state. Publication links, the actor profile link, the summary, and surrounding whitespace do not expand the group. Keep malformed children represented with the defensive generic activity presentation rather than silently dropping them.

### Subject group: many actors, one subject

Render `groupBy: 'subject'` as one collapsed, tappable row. The backend guarantees at most one child per actor for a recommendation/document, subscription/publication, or post-share/document subject, so `group.items.length` is the distinct actor count. Use the newest child actor as the primary actor and summarize the remaining child count:

```text
<primary actor> and <N others> subscribed to <publication> · <elapsed time>
<primary actor> and <N others> recommended <author>’s post <document> · <elapsed time>
```

Use each actor's sanitized `@handle`, falling back to their DID or translated `Unknown user`. Show their avatar at the leading edge and an `AvatarStack` of up to three unique remaining actors below the sentence. Exclude the primary actor because their avatar already appears at the leading edge. Do not render the proposed Subscribe button yet.

The entire summary row is a button with an expanded accessibility state. It starts collapsed with an `AvatarStack` for the remaining actors. Tapping replaces that stack with one compact row per remaining child in API order. Each compact row shows an avatar at the same size used by the collapsed stack and the actor's sanitized `@handle` immediately to its right, falling back to the DID or translated `Unknown user`. The primary actor stays represented by the leading avatar and summary sentence, so do not repeat them in the expanded rows. Tapping again restores the stack. Do not flatten those children into the outer virtualized list.

Render the hydrated subject beneath the summary. Build an `app.bsky.embed.external#viewExternal` from the subject and shared sidecars rather than changing the shared embed components. A `site.standard.publication` subject uses `PublicationCard`; a `site.standard.document` subject uses `StandardSiteEmbed`. Include available canonical URLs, descriptions, document dates, image blob CDN URLs, publication source metadata and theme, strong references, and hydrated actor profiles in the constructed view. Indent this subject content to the summary text column using the grouped avatar size plus the row gap, while retaining the row's normal outer padding.

Use `activity.record.uri`'s authority as the actor who performed the action. Resolve a referenced document or publication author from that referenced record's URI authority.

Actor handles are prefixed with `@`, sanitized with `sanitizeHandle`, and linked to the in-app profile route built by `makeProfileLink`. Document titles link to their canonical URL, constructed from the document `path` and either its direct HTTPS `site` or the referenced publication's `url`. Publication names link to the publication `url`. These links use normal text color and underline on hover/focus rather than using the default blue link color.

Actor labels use this fallback order:

1. actor `handle`;
2. authority DID;
3. translated `Unknown user` if no DID can be parsed.

Do not use actor display names in activity sentences.

For the explicit handle-oriented sentences below, render the available label without inventing a handle. Do not suppress a row because actor hydration is missing.

### Recommendation

For `site.standard.graph.recommend`:

1. Look up the root recommendation at `associatedRecords[activity.record.uri]`.
2. Read its `document` AT URI.
3. Look up that document in the same `associatedRecords` map.
4. Parse the document URI authority and resolve that actor from `actors`.
5. Read the document's `title`.

For a standalone recommendation, render the concise sentence:

```text
<recommender> recommended a post
```

Do not repeat the hydrated document author or title in the standalone sentence. Resolve the recommendation's `document` AT URI through `getRecommendedDocumentUri`, construct the subject with `createActivitySubjectView` and the complete associated-record and actor maps, and render it beneath the header with the shared `StandardSiteCompactDocumentCard`. Indent it like the standalone document attachment; do not use the full `StandardSiteEmbed` for this subject. If subject view construction fails, retain the concise header. Keep the actor link and elapsed time in one translated accessible sentence. Grouped recommendation summaries retain their own actor/count copy and are unchanged.

Fallbacks:

- Missing document actor: use its authority DID.
- Missing title: use translated `Untitled post`.
- Missing or invalid `document` reference: render the generic row.

### Document

For `site.standard.document`, render the concise standalone sentence:

```text
<document author> published an article
```

Do not repeat the hydrated document title in the activity sentence; the full `StandardSiteEmbed` beneath it presents that title. Keep the actor link and elapsed time, and use one translated sentence rather than concatenating translated fragments. The API's `textContent` is only a filtered preview and is not required in this first row design.

### Publication

For `site.standard.publication`, render:

```text
<publication author> created a publication
```

Do not repeat the hydrated publication name in the standalone sentence; use one translated sentence with the actor link and elapsed time. Resolve the publication from `activity.record.uri` through `createActivitySubjectView` with the complete associated-record and actor maps, then render it beneath the header with the existing `PublicationCard` and Activity publication-theme handling, indented like a standalone document embed. If view construction fails, retain the concise Activity header without a content card.

### Subscription

For `site.standard.graph.subscription`:

1. Read the root subscription's `publication` AT URI.
2. Look up the publication in the full `associatedRecords` map.
3. Read the publication's `name`.

Render:

```text
<subscriber> subscribed to a publication
```

Do not repeat the hydrated publication name in the standalone sentence; use one translated sentence with the actor link and elapsed time. A missing or invalid publication reference uses the generic row.

### Livestream

For `place.stream.livestream`, render an active record without `endedAt` as:

```text
<streamer> is livestreaming
```

When `endedAt` is present, calculate the elapsed duration from `createdAt` through `endedAt`, format it with the app's existing `displayDuration`, and render:

```text
<streamer> hosted a livestream for <duration>
```

Without a valid duration, render `<streamer> hosted a livestream`. Do not repeat the hydrated title in the standalone sentence; use one translated sentence with the actor link and elapsed time. Invalid or negative date intervals omit the duration defensively.

When `activity.view.$type` is `eric.bsky.atmosphere.getActivity#livestreamView` and `thumb` is a valid URI, render that CDN image beneath the row header. The backend uses the `feed_thumbnail` preset. Omit the image when the view or `thumb` is absent; do not fall back to parsing the raw `thumb` blob.

### Grain photo

For `social.grain.photo`, render:

```text
<photographer> posted a photo
```

Render the photo beneath the row header. Construct its `feed_fullsize` Bluesky CDN URL from the root URI authority DID, the `photo.ref` CID, and the extension implied by `photo.mimeType`. Preserve a valid record `aspectRatio`, default to a square, use `alt` as the accessibility label, and fall back to translated `Photo` when alt text is absent.

### Generic fallback

Unsupported collections, invalid URIs, missing root records, and malformed relationship records still render a row:

```text
Activity from <actor label>
```

Include the elapsed time. In development, the collection or URI may be shown only in a non-user-facing debug/accessibility-insensitive location if useful; do not expose raw malformed record JSON in the UI.

## Navigation

Atmosphere is a common authenticated screen, not a bottom tab.

### Route registration

Add:

```ts
Atmosphere: undefined
```

to `CommonNavigatorParams`, and register:

```text
Atmosphere -> /atmosphere
```

in `src/routes.ts`.

Register `AtmosphereScreen` in `commonScreens()` with:

- translated title `Atmosphere`;
- `requireAuth: true`.

### Drawer

Add an authenticated drawer row labeled **Atmosphere**. Place it after Notifications and before Feeds.

- Navigate to the common `Atmosphere` route and close the drawer.
- Add `isAtAtmosphere` to `useNavigationTabState()` so the drawer row can render as active.
- Include `isAtAtmosphere` in the hook's fallback check so Atmosphere is not incorrectly reported as Home.
- Emit `nav:click` with `{item: 'atmosphere', surface: 'drawer'}`.

Use `Atom_Stroke2_Corner0_Rounded` from `#/components/icons/Atom` for the first implementation. It may be used for both inactive and active states; active state is also communicated by the bold label.

### Desktop left navigation

Add **Atmosphere** after Notifications and before Chat, linking to `/atmosphere` with `navItem="atmosphere"` and the Atom icon.

Extend `Events['nav:click']['item']` with `'atmosphere'` so drawer and left-nav analytics remain typed. The existing `NavItem` route matching should determine the desktop active state from `/atmosphere`.

Do not add Atmosphere to the mobile or web bottom bar.

## Internationalization and accessibility

- Wrap every user-facing string in Lingui macros.
- Prefer `@lingui/react/macro` for new code.
- Use Unicode punctuation, including the typographic apostrophe in the English recommendation sentence.
- Keep each row's generated sentence available as a coherent accessibility label even if visual fragments use different font weights.
- Interactive retry controls require labels and useful accessibility hints.
- Standalone rows and actor recommendation or subscription summaries are not pressable. Subject-group summaries retain their existing group button behavior; actor profile links, compact document or publication links, and See more/See less controls expose independent semantics.
- Use `emoji` for actor labels, publication names, and document titles.

## Error behavior

Expected backend errors include missing or invalid authentication, an untracked viewer, an invalid cursor, and unavailable backend dependencies.

- Initial request errors show a translated failure state, cleaned error text, and Retry.
- Pagination errors preserve already loaded rows and appear in the list footer with Retry.
- Pull-to-refresh errors preserve existing rows and use the app's normal query/error behavior; they must not clear successful cached data.
- Do not log expected XRPC/network failures as unexpected application errors.

## Tests

Add focused tests for behavior that carries contract risk:

### Query tests

- uses the signed-in appview-sandbox client without caller-selected viewer or limit input;
- omits the cursor on page one and passes the returned cursor verbatim on page two;
- stops pagination when the cursor is absent;
- narrows valid `associatedRecords` and `actors` maps;
- replaces invalid map containers with empty maps.

### Row/model tests

- recommendation traverses `recommend -> document` and uses both actors plus the document title;
- subject groups summarize the primary actor plus remaining distinct-actor count, toggle between `AvatarStack` and compact avatar-and-handle rows for the remaining actors, preserve child order and viewer state, and never render nested groups;
- duplicate source recommendations or subscriptions from one actor to one target are represented once by the backend and require no frontend semantic deduplication;
- required-association filtering shrinks group counts before the frontend receives them, and ordinary missing document/publication chains do not render `Post unavailable`;
- standalone document rows render a full `StandardSiteEmbed` from complete hydrated sidecars and remain represented when view construction fails;
- actor document groups render one pluralized summary, preserve API order, collapse to two `StandardSiteCompactDocumentCard` rows, and toggle only from See more/See less; actor recommendation groups remain compact document lists, actor subscription groups use the same expandable layout with `PublicationCard`, and only other actor groups retain the red diagnostic boundary;
- every row receives the same full merged `associatedRecords` reference;
- associated maps from multiple loaded pages are merged;
- duplicate activity URIs are rendered once in first-seen order;
- document, publication, and subscription sentences use their associated data and canonical links;
- active and ended livestreams use the correct sentence and duration;
- active livestreams remain standalone even when the same actor has multiple nearby livestream records;
- post share views preserve their per-post like, reply, repost, quote, and bookmark counts on standalone, related, and grouped items;
- same-document post shares may subject-group, while different-document shares never actor-group and remain separate rows;
- livestream views render the backend-provided CDN thumbnail and omit the image when `thumb` is absent;
- Grain photo records construct and display the expected CDN image URL, aspect ratio, and alt text;
- actor handles are sanitized, prefixed with `@`, and linked to profiles;
- absent actors fall back to DIDs;
- missing references and unsupported collections produce a generic row instead of being dropped.

### Session/navigation coverage

- direct local appview-sandbox client targets `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` without a proxy header and sends the actor DID as development auth;
- default appview-sandbox client uses the deployed proxy service with the signed-in session;
- session bundle and strict/nullable provider hooks expose the same appview-sandbox client instance;
- cached account labeler subscriptions are applied to the appview-sandbox client;
- route typing and navigation compile for `Atmosphere`.

## Verification

Run the repository scripts, never their underlying tools directly:

```sh
pnpm prettier
pnpm lint
pnpm typecheck
pnpm test <focused test paths>
```

Do not run `pnpm intl:extract` or `pnpm intl:compile`.

Current authenticated-integration verification:

- frontend lexicon generation, formatting, lint, iOS/Android/web typechecks, and 11 focused suites with 96 tests passed;
- backend build, lint, and the focused `getActivity` suite with 10 tests passed after rebasing onto current `origin/main`;
- the local endpoint returned HTTP 401 without authorization and HTTP 200 with the enabled tracked DID;
- a later full backend run encountered broad 10-second timeouts across unrelated contributor suites after the rebase, so a clean full-suite result is not currently recorded for the rebased tree.

Manually verify:

- mobile drawer navigation and active state;
- desktop full and minimal left navigation;
- direct local backend loading through `.env.local`;
- recommendation traversal using the hydrated document and actor maps;
- pull-to-refresh and infinite pagination;
- missing actor and associated-record fallbacks;
- light and dark themes;
- narrow mobile and desktop web layouts.

## Acceptance criteria

1. Authenticated users can open `/atmosphere` from both the drawer and desktop left nav.
2. The screen uses `Layout.Screen` and `Layout.Header` and is not added to the bottom bar.
3. The query uses the authenticated appview-sandbox client, sends no caller-selected viewer or limit, and paginates with opaque cursors.
4. Every outer feed entry renders as a separate row in API order; grouped children render within their group row.
5. Every row receives the same complete merged `associatedRecords` object for the currently loaded pages.
6. A valid recommendation renders the recommender, document author, and document title by traversing the associated-record map.
7. All expected root collections, including post shares, have useful presentation, standalone documents render full `StandardSiteEmbed` content beneath their headers, actor document and recommendation groups render compact expandable document lists, Grain photos render beneath their row headers, actor handles and document/publication titles are linked, actor subscription groups render expandable publication cards, and malformed or unknown items render a generic fallback row.
8. Loading, empty, initial-error, refresh, next-page loading, and next-page error states are usable.
9. The appview-sandbox client supports both direct local development and the deployed PDS proxy configuration.
10. New user-facing strings are translatable and the focused tests, typecheck, lint, and formatting checks pass.
