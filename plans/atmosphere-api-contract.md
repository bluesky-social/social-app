# Atmosphere tab API contract

Status: active prototype contract

This document is the shared contract between the appview-sandbox Atmosphere backend session and the social-app Atmosphere tab frontend session. Read it before implementing or changing either side.

## Synchronization

| Item | Current value |
| --- | --- |
| Backend worktree | `/Users/eric/sites/bluesky/appview-sandbox-worktrees/atmosphere-tab` |
| Frontend worktree | `/Users/eric/sites/bluesky/social-app-internal-worktrees/atmosphere-tab` |
| Backend branch | `atmosphere-tab` |
| Frontend branch | `atmosphere-tab` |
| Synchronized backend base commit | `fa958a37012b Add livestream activity views and preserve active streams` |
| Uncommitted backend state | Batched post interaction-count hydration in `#shareView` atop `fa958a37012b` |
| Frontend tip | `d604edc59 Refine Atmosphere document share card layout and bylines` |
| Uncommitted frontend state | Contract synchronization only; no frontend implementation files changed by this backend session |
| Deployment status | The share-count backend changes are uncommitted and undeployed |

When the backend request, response, filtering, authentication, hydration, pagination, or grouping behavior changes, update this document and record the backend commit before asking the frontend session to consume the change.

Normative backend sources:

- `lexicons/eric/bsky/atmosphere/getActivity.json`
- `src/contributors/eric/api/bsky/atmosphere/getActivity.ts`
- `src/contributors/eric/atmosphere/record-filters.ts`
- `src/contributors/eric/atmosphere/activity-identity.ts`
- `ATMOSPHERE.md`

## Endpoint

```text
GET /xrpc/eric.bsky.atmosphere.getActivity
```

NSID:

```text
eric.bsky.atmosphere.getActivity
```

### Request parameters

| Parameter | Type | Required | Behavior |
| --- | --- | --- | --- |
| `cursor` | String | No | Opaque event-time/sequence pagination cursor returned by the previous page. Do not parse or construct it in the client. |

Current tracked viewer used for development:

```text
did:plc:3jpt2mvvsumj2r7eqk4gzzjz
```

### Authentication behavior

The endpoint requires appview-sandbox standard authentication and derives the viewer from `auth.credentials.did`. Callers cannot select another viewer through query parameters.

- The authenticated DID must be enabled in the backend's tracked-viewer registry.
- An authenticated but non-tracked viewer returns an XRPC `InvalidRequest` error.
- With the local direct URL override, send the signed-in actor DID as the raw authorization value accepted by appview-sandbox development mode.
- With the default deployed path, the signed-in session is proxied through the PDS to appview-sandbox and standard service auth supplies the viewer DID.

### Local request

```sh
curl --get 'http://localhost:3000/xrpc/eric.bsky.atmosphere.getActivity' \
  --header 'Authorization: did:plc:3jpt2mvvsumj2r7eqk4gzzjz'
```

## Response contract

The conceptual TypeScript shape is:

```ts
type ActivityView =
  | {
      $type: 'eric.bsky.atmosphere.getActivity#livestreamView'
      thumb?: string // feed_thumbnail CDN URL
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
    uri: string // AT URI
    cid: string
    indexedAt: string // Activity event time as an ISO datetime
  }
  collection: string // root record collection NSID
  viewerState: {
    subscribed: boolean
  }
  view?: ActivityView // appview-derived presentation data; currently emitted only for livestreams
  relatedActivity?: ActivityItem[] // on-page recommendations and post shares targeting this document; never recursively populated
}

type ActivityGroup = {
  $type: 'eric.bsky.atmosphere.getActivity#group'
  id: string // opaque deterministic list key; do not parse
  groupBy: 'subject' | 'actor'
  collection: string // root-record collection NSID, shared by every item
  indexedAt: string // newest child timestamp; equals items[0].record.indexedAt
  subject?: string // AT URI; present iff groupBy is 'subject'
  actor?: string // DID; present iff groupBy is 'actor'
  items: ActivityItem[] // reverse chronological, minimum length two, never groups
}

type AssociatedRecord = {
  uri: string // AT URI
  cid: string
  record: {
    $type?: string
    [key: string]: unknown
  }
}

type ProfileViewBasic = {
  did: string
  handle: string
  displayName?: string
  pronouns?: string
  avatar?: string
  createdAt?: string
  viewer?: {
    following?: string // Follow-record AT URI when the authenticated viewer follows this actor
  }
}

type GetActivityResponse = {
  feed: Array<ActivityItem | ActivityGroup>
  associatedRecords: Record<string, AssociatedRecord>
  actors: Record<string, ProfileViewBasic>
  cursor?: string
}
```

The generated lexicon type currently exposes `associatedRecords` and `actors` as `unknown`, so frontend code will need local narrowing or feature-specific types until the lexicon is made more specific.

`ActivityItem.view` is an optional typed union. The backend currently emits `#livestreamView` and `#shareView`; longform, photo, recommendation, and subscription remain empty extension points and are not emitted yet. Every livestream root receives `#livestreamView`. Its optional `thumb` is derived from the raw record's `thumb` blob as `https://cdn.bsky.app/img/feed_thumbnail/plain/<author DID>/<blob CID>`. A missing or malformed blob produces a livestream view without `thumb`; clients must not reconstruct the CDN URL from the raw blob. Every qualifying `app.bsky.feed.post` root receives `#shareView` with required `likeCount`, `replyCount`, `repostCount`, `quoteCount`, and `bookmarkCount`. These are current aggregate counts fetched by URI and CID in one dataplane call for all share roots on the page; a missing positional count is returned as zero.

### Example: standalone item

```json
{
  "feed": [
    {
      "$type": "eric.bsky.atmosphere.getActivity#item",
      "record": {
        "uri": "at://did:plc:recommender/site.standard.graph.recommend/abc",
        "cid": "bafy...",
        "indexedAt": "2026-09-03T00:00:00.000Z"
      },
      "collection": "site.standard.graph.recommend",
      "viewerState": {
        "subscribed": false
      }
    }
  ],
  "associatedRecords": {
    "at://did:plc:recommender/site.standard.graph.recommend/abc": {
      "uri": "at://did:plc:recommender/site.standard.graph.recommend/abc",
      "cid": "bafy...",
      "record": {
        "$type": "site.standard.graph.recommend",
        "document": "at://did:plc:author/site.standard.document/def",
        "createdAt": "2026-09-03T00:00:00.000Z"
      }
    },
    "at://did:plc:author/site.standard.document/def": {
      "uri": "at://did:plc:author/site.standard.document/def",
      "cid": "bafy...",
      "record": {
        "$type": "site.standard.document",
        "site": "at://did:plc:publisher/site.standard.publication/ghi",
        "title": "Example document",
        "textContent": "At most 300 Unicode characters are returned here.",
        "publishedAt": "2026-09-02T00:00:00.000Z"
      }
    }
  },
  "actors": {
    "did:plc:author": {
      "did": "did:plc:author",
      "handle": "author.example.com",
      "displayName": "Author",
      "avatar": "https://cdn.bsky.app/img/avatar/plain/did:plc:author/bafkrei...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "cursor": "opaque-cursor"
}
```

### Example: livestream item view

```json
{
  "$type": "eric.bsky.atmosphere.getActivity#item",
  "record": {
    "uri": "at://did:plc:streamer/place.stream.livestream/abc",
    "cid": "bafy-record",
    "indexedAt": "2026-09-11T00:00:00.000Z"
  },
  "collection": "place.stream.livestream",
  "viewerState": { "subscribed": false },
  "view": {
    "$type": "eric.bsky.atmosphere.getActivity#livestreamView",
    "thumb": "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:streamer/bafy-thumb"
  }
}
```

The view is preserved unchanged when the item appears inside a group or as related activity. `thumb` is optional, but the `#livestreamView` discriminator is present for every livestream item.

### Example: document with related recommendation activity

When a document root and recommendations targeting it occur on the same selected page, the recommendations move out of the outer feed and into the document's `relatedActivity`:

```json
{
  "feed": [
    {
      "$type": "eric.bsky.atmosphere.getActivity#item",
      "record": {
        "uri": "at://did:plc:author/site.standard.document/def",
        "cid": "bafy-document",
        "indexedAt": "2026-09-04T11:59:00.000Z"
      },
      "collection": "site.standard.document",
      "viewerState": { "subscribed": false },
      "relatedActivity": [
        {
          "$type": "eric.bsky.atmosphere.getActivity#item",
          "record": {
            "uri": "at://did:plc:ryan/site.standard.graph.recommend/one",
            "cid": "bafy-recommendation",
            "indexedAt": "2026-09-04T12:00:00.000Z"
          },
          "collection": "site.standard.graph.recommend",
          "viewerState": { "subscribed": false }
        }
      ]
    }
  ]
}
```

This projection is page-local and happens before normal subject and actor grouping. It adds no time rule beyond existing page selection. A related recommendation or post share appears nowhere else in the response tree. The document retains its own outer timestamp, and `relatedActivity` remains attached if the document becomes an actor-group child. Related roots whose document is not an outer root on the page continue through normal grouping.

For an `app.bsky.feed.post` share, `associatedRecords[postUri].record` is the complete raw post record persisted from Jetstream—not an `app.bsky.feed.defs#postView`. The raw record includes available post fields such as `text`, `facets`, `embed`, `langs`, `labels`, and `tags`. Post interaction counts are available separately in that item's `#shareView`; clients must not expect them inside the raw record:

```json
{
  "$type": "eric.bsky.atmosphere.getActivity#shareView",
  "likeCount": 12,
  "replyCount": 3,
  "repostCount": 4,
  "quoteCount": 2,
  "bookmarkCount": 6
}
```

A qualifying post uses either a direct `app.bsky.embed.external` or `app.bsky.embed.recordWithMedia` with external media, and that external object contains a strong `associatedRefs` reference to `site.standard.document`. The referenced document and publication are recursively present in `associatedRecords` when renderable.

### Example: subject group

Multiple actors recommending the same document, grouped by `groupBy: "subject"`:

```json
{
  "feed": [
    {
      "$type": "eric.bsky.atmosphere.getActivity#group",
      "id": "opaque-subject-group-id",
      "groupBy": "subject",
      "collection": "site.standard.graph.recommend",
      "subject": "at://did:plc:author/site.standard.document/def",
      "indexedAt": "2026-09-04T12:00:00.000Z",
      "items": [
        {
          "$type": "eric.bsky.atmosphere.getActivity#item",
          "record": {
            "uri": "at://did:plc:alice/site.standard.graph.recommend/one",
            "cid": "bafy...",
            "indexedAt": "2026-09-04T12:00:00.000Z"
          },
          "collection": "site.standard.graph.recommend",
          "viewerState": { "subscribed": false }
        },
        {
          "$type": "eric.bsky.atmosphere.getActivity#item",
          "record": {
            "uri": "at://did:plc:bob/site.standard.graph.recommend/two",
            "cid": "bafy...",
            "indexedAt": "2026-09-04T11:56:00.000Z"
          },
          "collection": "site.standard.graph.recommend",
          "viewerState": { "subscribed": false }
        }
      ]
    }
  ],
  "associatedRecords": {
    "at://did:plc:alice/site.standard.graph.recommend/one": {
      "uri": "at://did:plc:alice/site.standard.graph.recommend/one",
      "cid": "bafy...",
      "record": {
        "$type": "site.standard.graph.recommend",
        "document": "at://did:plc:author/site.standard.document/def",
        "createdAt": "2026-09-04T12:00:00.000Z"
      }
    },
    "at://did:plc:bob/site.standard.graph.recommend/two": {
      "uri": "at://did:plc:bob/site.standard.graph.recommend/two",
      "cid": "bafy...",
      "record": {
        "$type": "site.standard.graph.recommend",
        "document": "at://did:plc:author/site.standard.document/def",
        "createdAt": "2026-09-04T11:56:00.000Z"
      }
    },
    "at://did:plc:author/site.standard.document/def": {
      "uri": "at://did:plc:author/site.standard.document/def",
      "cid": "bafy...",
      "record": {
        "$type": "site.standard.document",
        "site": "at://did:plc:publisher/site.standard.publication/ghi",
        "title": "Example document",
        "textContent": "At most 300 Unicode characters are returned here.",
        "publishedAt": "2026-09-02T00:00:00.000Z"
      }
    }
  },
  "actors": {
    "did:plc:alice": {
      "did": "did:plc:alice",
      "handle": "alice.example.com",
      "displayName": "Alice"
    },
    "did:plc:bob": {
      "did": "did:plc:bob",
      "handle": "bob.example.com",
      "displayName": "Bob"
    },
    "did:plc:author": {
      "did": "did:plc:author",
      "handle": "author.example.com",
      "displayName": "Author"
    }
  },
  "cursor": "opaque-cursor"
}
```

### Example: actor group

One actor publishing multiple documents, grouped by `groupBy: "actor"`:

```json
{
  "$type": "eric.bsky.atmosphere.getActivity#group",
  "id": "opaque-actor-group-id",
  "groupBy": "actor",
  "collection": "site.standard.document",
  "actor": "did:plc:author",
  "indexedAt": "2026-09-04T09:00:00.000Z",
  "items": [
    {
      "$type": "eric.bsky.atmosphere.getActivity#item",
      "record": {
        "uri": "at://did:plc:author/site.standard.document/three",
        "cid": "bafy...",
        "indexedAt": "2026-09-04T09:00:00.000Z"
      },
      "collection": "site.standard.document",
      "viewerState": { "subscribed": true }
    },
    {
      "$type": "eric.bsky.atmosphere.getActivity#item",
      "record": {
        "uri": "at://did:plc:author/site.standard.document/four",
        "cid": "bafy...",
        "indexedAt": "2026-09-04T08:50:00.000Z"
      },
      "collection": "site.standard.document",
      "viewerState": { "subscribed": true }
    }
  ]
}
```

A `groupBy: "actor"` group omits `subject`; a `groupBy: "subject"` group omits `actor`. Both variants share the rest of the `ActivityGroup` shape.

## Response invariants

### Feed

- `feed` is the ordered pagination skeleton only. It is a Lexicon `$type`-discriminated union of `ActivityItem` and `ActivityGroup`; narrow on `$type`, never on field presence.
- An item has `{ $type, record, collection, viewerState, view?, relatedActivity? }`; `collection` is the root record NSID. A group has exactly `{ $type, id, groupBy, collection, indexedAt, subject|actor, items }`.
- Item records at every depth contain only `{uri, cid, indexedAt}`; `collection` is a sibling field and neither carries raw record payloads.
- `group.items` is `ActivityItem[]` with minimum length two; groups never nest, so `group.items` never contains an `ActivityGroup`. A document item may carry `relatedActivity: ActivityItem[]`; those children are recommendations or post shares and never recursively carry related activity.
- Every item inside a group has the same `collection` as `group.collection`.
- Results are ordered by activity event time descending, with sequence descending as a stable tie-breaker. A group's timestamp is its newest item's timestamp, copied to `group.indexedAt`, which equals `group.items[0].record.indexedAt`; items inside a group are also reverse chronological.
- `indexedAt` is the activity event time, including for backfilled rows; it is not the PostgreSQL projection-write time.
- Results are limited to the rolling 30-day activity window.
- Grouping is read-time and page-local: it runs after the 10-200 candidate-root page selection and render-required association filtering, never crosses a cursor boundary, and does not alter stored activity rows, associated-record hydration, or actor hydration. Root pagination uses the same age-tier windows as grouping so its normal gap boundary does not split a possible group.
- Before pagination and grouping, the materialized feed collapses multiple active recommendation records from one actor to one `/document` target, multiple subscription records from one actor to one `/publication` target, and multiple qualifying post shares from one actor to one external associated document into one logical activity. Different actors remain distinct.
- The earliest active source record represents a collapsed logical activity. A later duplicate does not bump it. If that representative is deleted while another duplicate remains active, the backend promotes the next-earliest record, so the returned root URI may change without the logical action disappearing.
- Related-activity projection runs first. A recommendation whose `/document` target or a post whose external `associatedRefs` target is also a document root on the selected page moves beneath that document and is consumed. It does not also appear as an outer item or grouping child. The document keeps its own timestamp and can subsequently become an actor-group child with `relatedActivity` intact.
- Subject interaction grouping then runs for remaining recommendations keyed by `/document`, subscriptions keyed by `/publication`, and posts keyed by their external associated document, partitioned by collection NSID plus target AT URI. Because activity is already logically deduplicated, every child in one of these subject groups represents a distinct actor. Only items left unconsumed by that pass become eligible for actor grouping by author DID plus collection NSID, except that post shares are always excluded. Same-document shares may already have formed a subject group; shares of different documents remain separate rows even when authored by one actor. In the actor pass, root documents with `viewerState.subscribed: true` remain standalone; only unsubscribed documents are eligible to group under their actor. Active `place.stream.livestream` records without `endedAt` also remain standalone regardless of nearby streams from the same actor; ended livestreams retain normal actor grouping.
- Every grouping pass evaluates candidate clusters against one fixed request timestamp, not the current wall-clock time at each evaluation. An anchor younger than one hour uses an inclusive 30-minute maximum span; an anchor at least one hour old and no more than 12 hours old uses an inclusive one-hour maximum span; an anchor more than 12 hours old and no more than 24 hours old uses an inclusive four-hour maximum span; and an anchor more than 24 hours old uses an inclusive eight-hour maximum span. Exactly 12 hours uses the one-hour tier and exactly 24 hours uses the four-hour tier. Clusters do not chain through adjacent events.
- A cluster of exactly one item never becomes a group. It remains, or returns to being, a standalone `ActivityItem` in the feed.
- Every root activity URI is assigned exactly once across the whole response: as a standalone item, as one direct group item, or as one document's `relatedActivity` child.
- Each realized group has at least two items, and deterministic opaque IDs distinguish separate temporal clusters that otherwise share `groupBy`, `collection`, and `subject`/`actor` (see Group identifiers below).
- Every item has a required root-record `collection` NSID and a required `viewerState.subscribed` boolean, whether it appears standalone or inside a group.
- `subscribed` is `true` only for a root `site.standard.document` whose `site` publication AT URI matches one of the viewer's current `site.standard.graph.subscription` records. It is `false` for non-document activity and documents without a matching subscription.
- Subscription state is resolved for the whole page with one indexed PostgreSQL query and no per-item or Tango requests.
- Every item's `record.uri`, whether standalone or nested inside a group, has a corresponding entry in `associatedRecords`.
- Use `associatedRecords[item.record.uri].record` to obtain each raw root payload, for both standalone items and items nested inside a group.
- The same URI is materialized at most once for a viewer even if it qualifies through multiple fanout paths.

### Group identifiers

- `group.id` is opaque and deterministic for a given grouping result. Treat it only as a stable list key for this response; never parse it or assume it persists across separate requests or regrouping.
- The backend derives `id` from `groupBy`, the collection NSID, the subject AT URI or actor DID, and the newest item's root URI.
- Because the newest item's URI is part of the derivation, two temporal clusters that otherwise share `groupBy`, `collection`, and `subject`/`actor` (for example, a burst of recommendations for the same document an hour apart) still receive distinct IDs.

### Associated records

- `associatedRecords` includes every root feed record plus recursively resolved local records referenced by AT URI.
- Hydration is breadth-first to a maximum depth of four.
- The backend fetches at most 100 recursively associated records in addition to feed-root records.
- Missing, deleted, or unavailable references do not fail the whole request. Before grouping, they suppress a root when they occupy a configured render-required relationship: recommendation `/document`, post-share external associated document, subscription `/publication`, or document `/site` when it is an AT URI. Requirements recurse, so a recommendation is suppressed when its document exists but that document's AT-URI publication does not.
- HTTPS document sites remain valid. Missing AT URIs outside configured render-required paths, such as Bluesky post references, do not suppress activity.
- Filtering can shrink a group or turn a would-be group into a standalone item. Clients should use the returned group item count without accounting for omitted roots.
- Records come from appview-sandbox PostgreSQL, not from the user's PDS at request time.
- Record objects are read-time projections and are not guaranteed to be byte-for-byte copies of the ingested record.

Common resolution paths include:

```text
recommendation -> document -> publication
post share -> document -> publication
subscription -> publication
document -> publication
```

### Actors

- `actors` is keyed by DID.
- Values are `app.bsky.actor.defs#profileViewBasic` objects.
- The backend currently populates `did`, `handle`, `displayName`, `pronouns`, `avatar`, and `createdAt` when available.
- `viewer.following`, when present, is the standard ProfileViewBasic follow-record AT URI showing that the authenticated viewer follows this actor. Its absence must be treated as not followed; do not infer following from activity inclusion or document/publication subscription state.
- `avatar`, when present, is a ready-to-render Bluesky CDN URL.
- Actor hydration is batched through Tango `GetActors` for authority DIDs discovered from root and recursively associated AT URIs.
- An actor may be absent if Tango does not return an existing actor with a handle. The frontend must tolerate missing actor entries.

## Frontend narrowing and rendering

- Discriminate every `feed` entry on `$type`, not on which fields are present. Check `entry.$type === 'eric.bsky.atmosphere.getActivity#group'` before reading `entry.items`, `entry.groupBy`, `entry.subject`, or `entry.actor`.
- Within a group, use `entry.groupBy` to decide whether `subject` or `actor` is the populated identifier; the Lexicon union cannot express that conditional requirement, so TypeScript alone will not narrow it for you.
- Use `entry.id` as the React/FlatList key for a group and `entry.record.uri` as the key for a standalone item at the outer list level. Use each nested `item.record.uri` as the key inside `entry.items` and `item.relatedActivity`.
- Do not flatten `entry.items` or `item.relatedActivity` into the outer `feed` list. Flattening discards the projection the backend computed. Render a group as one list row that internally lists or summarizes its items, and render related recommendations or post shares within their document row.
- Because grouping can collapse many roots into one outer entry, `feed.length` no longer tracks the number of underlying root activity records. Do not use `feed.length` to infer page size or to decide whether a page is "full".
- Concatenate `page.feed` arrays across pages in the order pages are fetched; do not merge or re-group entries across pages, since grouping is computed independently per page and never crosses a cursor boundary.

## Read-time record filtering

Filtering happens only while constructing `getActivity`; ingestion and stored PostgreSQL records are not modified.

Filters are configured by record `$type` in the backend's generic registry:

```text
src/contributors/eric/atmosphere/record-filters.ts
```

Current filters:

| Record type | Read-time transformation |
| --- | --- |
| `site.standard.document` | Remove `content` entirely. Truncate `textContent` to at most 300 Unicode characters. |
| All other types | Return unchanged. |

Frontend implications:

- Never expect `site.standard.document.content` in this response.
- `textContent` is a preview, not the full document body.
- Do not infer that the stored source record lacked fields omitted by a read filter.

## Record types currently expected in the feed

All enabled collections except `site.standard.publication` can appear as feed roots when authored by followed users. Qualifying live-tail `app.bsky.feed.post` document shares can also appear, but unrelated posts are never persisted and no post archive is backfilled. Publication subscriptions can additionally qualify documents. Publications remain indexed and can appear in `associatedRecords`, but publication creations do not materialize feed activity.

```text
site.standard.document
site.standard.graph.recommend
site.standard.graph.subscription
place.stream.livestream
social.grain.photo
app.bsky.feed.post // qualifying shares only; separate live-only stream
```

Useful reference fields:

| `$type` | Important relationship |
| --- | --- |
| `site.standard.document` | `site` may reference a `site.standard.publication` AT URI. |
| `site.standard.graph.recommend` | `document` references a `site.standard.document` AT URI. |
| `site.standard.graph.subscription` | `publication` references a `site.standard.publication` AT URI. |
| `site.standard.publication` | No required associated-record relationship. |
| `place.stream.livestream` | `createdAt` marks the start; an `endedAt` value marks completion. |
| `social.grain.photo` | `photo` is a blob with an optional `alt` and `aspectRatio`. |
| `app.bsky.feed.post` | A direct or record-with-media external embed has `external.associatedRefs` containing a strong ref to `site.standard.document`. |

The current local registry includes `place.stream.livestream` and `social.grain.photo` in addition to the four collections seeded by the backend migration. For display and grouping, an absent `endedAt` means the stream is active. Active livestreams are always standalone. Ended-stream duration is the elapsed time from `createdAt` to `endedAt`, and ended livestreams may be actor-grouped normally.

Associated record payloads otherwise use raw lexicon JSON. Blob-valued fields such as document `coverImage`, publication `icon`, and Grain `photo` are not converted to CDN URLs by this endpoint. The frontend constructs a Bluesky image CDN URL for Grain photos from the root URI authority DID, blob CID, and MIME type. Actor `avatar` is the endpoint-provided exception.

## Pagination

Use the response cursor verbatim:

```ts
const nextPage = await getActivity({
  cursor: previousPage.cursor,
})
```

- Page size is server-controlled over candidate root activity records; there is no `limit` parameter.
- A page selects at least 10 candidate roots when available. Required-association filtering happens afterward, so the returned feed can contain fewer than 10 roots and the cursor advances past omitted candidates.
- After root record 10, each adjacent gap is compared with the grouping window selected from the newer event’s age at the fixed request time: 30 minutes when younger than one hour, one hour through 12 hours old, four hours when older than 12 through 24 hours old, and eight hours when older than 24 hours.
- A page contains at most 200 root records; grouping can make the outer `feed` array shorter.
- The event whose gap exceeds its age-tier window, or root record 201, begins the next page.
- Grouping is page-local and never crosses a cursor boundary. Sharing the age tiers prevents ordinary gap pagination from splitting a possible group; the 200-root cap can still split one.
- An absent `cursor` means there is no next page.
- Cursors are opaque implementation details and may change format.
- The client should concatenate `page.feed` arrays in response order; see Frontend narrowing and rendering above for why this must not flatten `ActivityGroup.items` into that list.
- Deduplicate defensively by `record.uri` if live cache updates are added later, checking both standalone item URIs and URIs nested inside `ActivityGroup.items`.

## Errors

Expected XRPC error shape:

```json
{
  "error": "InvalidRequest",
  "message": "Viewer is not tracked by Atmosphere"
}
```

Known client-relevant failures:

- The request is unauthenticated or its service authentication is invalid.
- Viewer is not tracked or is disabled.
- Cursor is invalid.
- Backend database or Tango actor hydration is unavailable.

## Frontend transport expectations

The appview-sandbox service is threaded through the app's session bundle as a dedicated `@atproto/lex` client, following the existing chat-client pattern rather than constructing a client inside the Atmosphere feature.

Deployed proxy service identifier:

```text
did:web:appview-sandbox.k1.prod.bsky.dev#bsky_appviewSandbox
```

Expected environments:

- With `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` unset, proxy through the signed-in user's PDS to the deployed service. The sandbox client retains session authentication and emits the proxy service header through its `service` configuration.
- For tandem local development, put `EXPO_PUBLIC_APPVIEW_SANDBOX_URL=http://localhost:3000` in the frontend worktree's uncommitted `.env.local`, call that origin directly, and send the signed-in DID as the development authorization value.
- When exposing Expo web through a tunnel, set `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` to the backend's public HTTPS tunnel origin and restart Expo so the public environment value is rebuilt into the bundle. Do not expose PostgreSQL or the Node inspector. Development raw-DID authorization is not suitable for an unprotected public backend tunnel.
- Do not commit a developer-local URL.
- The current backend commits are not deployed, so this exact contract requires the local appview-sandbox service until the backend branch is pushed and deployed.

The frontend must copy the backend lexicon to:

```text
lexicons/eric/bsky/atmosphere/getActivity.json
```

Then run the repository's normal lexicon generation command before importing the generated schema. Keep the copied lexicon byte-for-byte aligned with the backend source.

## Change log

### Uncommitted authenticated-viewer integration atop backend `1fccfce`

- Requires standard appview-sandbox authentication for `getActivity`.
- Derives the viewer from `auth.credentials.did` and removes caller-selected `viewer` input.
- Uses raw DID authorization for direct local development and PDS-proxied service auth for deployed requests.
- Renames the frontend session surface to the shared `appviewSandboxClient` and applies account labeler subscriptions.
- Is implemented in both working trees. The local endpoint has been verified to return HTTP 401 without authorization and HTTP 200 with the enabled tracked DID; the backend and frontend integration changes remain uncommitted and undeployed.

### Backend `1fccfce`

- Filters activity roots with incomplete render-required associated-record chains before grouping.
- Recommendations require document hydration and, for documents with AT-URI sites, publication hydration. Subscriptions require publication hydration; standalone documents require publication hydration only for AT-URI sites.
- Group counts now exclude incomplete children, and groups that fall below two children become standalone items.
- The response schema and cursor encoding are unchanged.

### Backend `68c0721`

- Added materialized logical activity identity without changing the XRPC response schema.
- Duplicate recommendations by one actor to one document and duplicate subscriptions by one actor to one publication now return one activity.
- Subject-group child counts therefore count distinct actors instead of duplicate source records.
- The earliest active source record is returned; deleting it promotes the next active duplicate.
- Raw source records remain independently indexed in PostgreSQL.

### Backend `0fae442`

- Root pagination uses the same age-tier windows as grouping to avoid splitting eligible groups at a smaller gap boundary.
- The 200-root cap can still split a dense group across cursor pages.

### Backend `8abcd9e`

- `feed` is now a `$type`-discriminated `Item | Group` union.
- Subject-first interaction grouping and actor-plus-collection grouping use fixed-time anchor windows and never nest or duplicate root URIs.
- Chronology, viewer state, read filtering, hydration, sidecars, and temporary viewer behavior remain unchanged.
- Root pagination now uses the same age-tier windows as grouping to avoid splitting eligible groups at a smaller gap boundary.

### Uncommitted backend contract updates

- Grouping age thresholds, inclusivity, and spans are centralized in the backend's exported `GROUPING_WINDOW_TIERS`; the under-one-hour span is now 30 minutes, and pagination uses the same resolver.
- `ActivityItem.relatedActivity?: ActivityItem[]` contains reverse-chronological recommendation and post-share roots targeting an on-page document root.
- Related recommendations and post shares are consumed before subject and actor grouping and occur nowhere else in the response tree.
- Remaining post shares group by the referenced document, every share's complete raw post record is keyed by its post URI in `associatedRecords`, and every share item carries its own current interaction counts in `#shareView`.
- Attachment is page-local, uses the existing page-selection boundary as its temporal scope, and remains present when a document becomes an actor-group child.

- Added required `feed[].collection`, the root record's NSID, to standalone items and group children.
- Removed `site.standard.publication` creation from the activity projection. Publication records remain available for local associated-record hydration.
- Actor document groups include only documents whose publication is not currently subscribed by the viewer; subscribed documents remain standalone.
- Active livestreams without `endedAt` remain standalone; only ended livestreams may appear in an actor group.
- Post shares never appear in actor groups. Same-document shares may appear in a subject group; different-document shares remain separate rows.

### Backend `d39fe59`

- Changed each feed item from `{uri, cid, indexedAt, viewerState}` to `{record: {uri, cid, indexedAt}, viewerState}`.
- Raw root payloads remain in `associatedRecords`; they are not duplicated in `feed`.

### Backend `db3c141`

- Added required `feed[].viewerState.subscribed`.
- Resolve matching document-publication subscriptions once per page using the local edge index.
- Return `false` for non-document feed roots.

### Backend `6936b16`

- Removed the caller-controlled `limit` parameter.
- Added server-controlled 10-200 item burst-aware pagination.
- Ordered activity by event time descending with sequence as a tie-breaker.
- Changed `indexedAt` to the activity event time.
- Changed the opaque cursor to carry event time and sequence.

### Backend `816cea3`

- Removed records from `feed[]`.
- Added every feed-root record to `associatedRecords`.
- Added generic collection-specific read filters.
- Removed document `content` and limited document `textContent` to 300 Unicode characters.

### Backend `0d69bc5`

- Temporarily removed endpoint authentication.
- Added optional explicit `viewer` selection with Eric's DID as the temporary default.
- Added `ProfileViewBasic.avatar` hydration using Bluesky CDN URLs.

### Backend `32039fc`

- Added local follow materialization and followed-author feed fanout.
- Added Eric as a tracked viewer in the local development database.
