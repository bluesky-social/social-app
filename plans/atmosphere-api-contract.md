# Atmosphere tab API contract

Status: active prototype contract

This document is the shared contract between the appview-sandbox Atmosphere backend session and the social-app Atmosphere tab frontend session. Read it before implementing or changing either side.

## Synchronization

| Item | Current value |
| --- | --- |
| Backend worktree | `/Users/eric/sites/bluesky/appview-sandbox-worktrees/atmosphere-tab` |
| Frontend worktree | `/Users/eric/sites/bluesky/social-app-worktrees/atmosphere-tab` |
| Backend branch | `atmosphere-tab` |
| Frontend branch | `atmosphere-tab` |
| Last synchronized backend commit | `816cea3 Filter Atmosphere records on read` |
| Deployment status | Backend changes are local and have not been pushed or deployed |

When the backend request, response, filtering, authentication, or hydration behavior changes, update this document and the synchronized backend commit before asking the frontend session to consume the change.

Normative backend sources:

- `lexicons/eric/bsky/atmosphere/getActivity.json`
- `src/contributors/eric/api/bsky/atmosphere/getActivity.ts`
- `src/contributors/eric/atmosphere/record-filters.ts`
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
| `viewer` | DID string | No | Tracked viewer whose materialized feed should be returned. Temporarily defaults to Eric's DID. The frontend should still pass the signed-in user's DID explicitly. |
| `limit` | Integer | No | Defaults to `30`; minimum `1`; maximum `100`. |
| `cursor` | String | No | Opaque pagination cursor returned by the previous page. Do not parse or construct it in the client. |

Current tracked viewer used for development:

```text
did:plc:3jpt2mvvsumj2r7eqk4gzzjz
```

### Temporary authentication behavior

The endpoint currently has no authentication requirement. This is temporary prototype behavior for local frontend development.

- Send `viewer` explicitly even though it is currently optional.
- The selected DID must be enabled in the backend's tracked-viewer registry.
- A non-tracked viewer returns an XRPC `InvalidRequest` error.
- Do not design the frontend around the endpoint remaining unauthenticated.

### Local request

```sh
curl --get 'http://localhost:3000/xrpc/eric.bsky.atmosphere.getActivity' \
  --data-urlencode 'viewer=did:plc:3jpt2mvvsumj2r7eqk4gzzjz' \
  --data-urlencode 'limit=30'
```

No request headers are currently required.

## Response contract

The conceptual TypeScript shape is:

```ts
type ActivityItem = {
  uri: string // AT URI
  cid: string
  indexedAt: string // ISO datetime
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
}

type GetActivityResponse = {
  feed: ActivityItem[]
  associatedRecords: Record<string, AssociatedRecord>
  actors: Record<string, ProfileViewBasic>
  cursor?: string
}
```

The generated lexicon type currently exposes `associatedRecords` and `actors` as `unknown`, so frontend code will need local narrowing or feature-specific types until the lexicon is made more specific.

### Example

```json
{
  "feed": [
    {
      "uri": "at://did:plc:recommender/site.standard.graph.recommend/abc",
      "cid": "bafy...",
      "indexedAt": "2026-09-03T00:00:00.000Z"
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

## Response invariants

### Feed

- `feed` is the ordered pagination skeleton only. It does not contain records.
- Results are ordered by descending materialized activity sequence.
- Results are limited to the rolling 30-day activity window.
- Every `feed[i].uri` has a corresponding entry in `associatedRecords`.
- Use `associatedRecords[feed[i].uri].record` to obtain the root record.
- The same URI is materialized at most once for a viewer even if it qualifies through multiple fanout paths.

### Associated records

- `associatedRecords` includes every root feed record plus recursively resolved local records referenced by AT URI.
- Hydration is breadth-first to a maximum depth of four.
- The backend fetches at most 100 recursively associated records in addition to feed-root records.
- Missing, deleted, or unavailable references are omitted.
- Records come from appview-sandbox PostgreSQL, not from the user's PDS at request time.
- Record objects are read-time projections and are not guaranteed to be byte-for-byte copies of the ingested record.

Common resolution paths include:

```text
recommendation -> document -> publication
subscription -> publication
document -> publication
```

### Actors

- `actors` is keyed by DID.
- Values are `app.bsky.actor.defs#profileViewBasic` objects.
- The backend currently populates `did`, `handle`, `displayName`, `pronouns`, `avatar`, and `createdAt` when available.
- `avatar`, when present, is a ready-to-render Bluesky CDN URL.
- Actor hydration is batched through Tango `GetActors` for authority DIDs discovered from root and recursively associated AT URIs.
- An actor may be absent if Tango does not return an existing actor with a handle. The frontend must tolerate missing actor entries.

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

All enabled collections can appear as feed roots when authored by followed users. Publication subscriptions can additionally qualify documents.

```text
site.standard.document
site.standard.publication
site.standard.graph.recommend
site.standard.graph.subscription
```

Useful reference fields:

| `$type` | Important relationship |
| --- | --- |
| `site.standard.document` | `site` may reference a `site.standard.publication` AT URI. |
| `site.standard.graph.recommend` | `document` references a `site.standard.document` AT URI. |
| `site.standard.graph.subscription` | `publication` references a `site.standard.publication` AT URI. |
| `site.standard.publication` | No required associated-record relationship. |

Associated record payloads otherwise use raw lexicon JSON. Blob-valued fields such as document `coverImage` and publication `icon` are not currently converted to CDN URLs by this endpoint. Actor `avatar` is the exception.

## Pagination

Use the response cursor verbatim:

```ts
const nextPage = await getActivity({
  viewer,
  limit: 30,
  cursor: previousPage.cursor,
})
```

- An absent `cursor` means there is no next page.
- Cursors are implementation details and may change format.
- The client should flatten pages in response order.
- Deduplicate by activity `uri` defensively if live cache updates are added later.

## Errors

Expected XRPC error shape:

```json
{
  "error": "InvalidRequest",
  "message": "Viewer is not tracked by Atmosphere"
}
```

Known client-relevant failures:

- Viewer is not tracked or is disabled.
- Cursor is invalid.
- `limit` is outside the lexicon bounds or is not an integer.
- Backend database or Tango actor hydration is unavailable.

## Frontend transport expectations

The appview-sandbox service should eventually be threaded through the app's session bundle as a dedicated `@atproto/lex` client, following the existing chat-client pattern rather than constructing a client inside the Atmosphere feature.

Deployed proxy service identifier:

```text
did:web:appview-sandbox.k1.prod.bsky.dev#bsky_appviewSandbox
```

Expected environments:

- With `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` unset, proxy through the signed-in user's PDS to the deployed service.
- For tandem local development, put `EXPO_PUBLIC_APPVIEW_SANDBOX_URL=http://localhost:3000` in the frontend worktree's uncommitted `.env.local` and call that origin directly.
- Do not commit a developer-local URL.
- The current backend commits are not deployed, so this exact contract requires the local appview-sandbox service until the backend branch is pushed and deployed.

The frontend must copy the backend lexicon to:

```text
lexicons/eric/bsky/atmosphere/getActivity.json
```

Then run the repository's normal lexicon generation command before importing the generated schema. Keep the copied lexicon byte-for-byte aligned with the backend source.

## Change log

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
