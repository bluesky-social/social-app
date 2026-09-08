# Activity screen frontend specification

Status: proposed; backend read-time grouping is committed locally, logical activity deduplication is implemented in the uncommitted backend working tree, and neither repository has been pushed or deployed.

This document specifies the first frontend for the Atmosphere activity API described in [`atmosphere-api-contract.md`](./atmosphere-api-contract.md).

## Goal

Add an authenticated **Activity** screen that displays the signed-in user's Atmosphere activity as a paginated list. Add entry points named **Activity** to the mobile drawer and desktop left navigation.

Each top-level API feed entry is rendered as its own row. A standalone item renders its activity. A subject group renders a collapsed summary for many actors interacting with the same content and expands in place to show its child activities. Actor-group presentation is still provisional and keeps the red diagnostic boundary around its children. Every row receives the complete merged `associatedRecords` map, not only its root record, so it can follow record references such as:

```text
recommendation -> document -> publication
subscription -> publication
document -> publication
```

The initial recommendation presentation should read like:

```text
<recommender handle> recommended <document author handle>’s post <document title>
```

## Scope

This work includes:

- the `eric.bsky.atmosphere.getActivity` lexicon and generated client schema;
- an appview-sandbox client in the session bundle;
- a camelCase React Query module;
- a new authenticated route and screen;
- a drawer item and desktop left-navigation item;
- loading, empty, error, refresh, and pagination states;
- basic rows for all six record collections currently returned by the API;
- inline rendering for Grain photo records;
- linked actor handles, documents, and publications;
- defensive rendering for missing or malformed associated records and actors.

This work does not include:

- an Activity bottom-tab item;
- full article rendering;
- converting document cover-image or publication-icon blobs to CDN URLs;
- interactions that create, delete, or update Atmosphere records;
- a detail screen for Activity rows;
- persisted query data or live cache updates.

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

Add a dedicated appview-sandbox client to the session bundle, following the existing `chatClient` structure:

- add an `atmosphereClient: Client` member to `SessionBundle`;
- add a `buildAtmosphereClient()` factory in `src/state/session/clients.ts`;
- construct it with the other clients in `buildBundle()`;
- expose it as `useAtmosphereClient()` from `src/state/session/index.tsx`;
- update session test fixtures and client/bundle tests to include it.

Service behavior:

- When `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` is unset, use the signed-in session and proxy through the PDS to:

  ```text
  did:web:appview-sandbox.k1.prod.bsky.dev#bsky_appviewSandbox
  ```

- When `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` is set, send requests directly to that origin and do not set an `atproto-proxy` header. Tandem local development uses `http://localhost:3000` in the uncommitted `.env.local`.
- Add an empty, documented `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` entry to `.env.example` and expose the value through `#/env`.
- The screen is authenticated even though the prototype endpoint currently is not. Do not make the UI or query depend on the endpoint remaining unauthenticated.

## Data model and narrowing

Define feature-local structural types in the camelCase query module. They should describe only fields this screen reads.

```ts
type ActivityItem = {
  $type: 'eric.bsky.atmosphere.getActivity#item'
  record: {
    uri: string
    cid: string
    indexedAt: string
  }
  viewerState: {
    subscribed: boolean
  }
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

Grouping is computed by the backend after root pagination and is page-local. Root pagination uses the same age-tier windows for adjacent gap boundaries, preventing its normal gap boundary from splitting a possible group; the 200-root cap can still split one. Each candidate cluster uses one fixed request timestamp and an anchor-based maximum span; it never chains through adjacent events. An anchor younger than one hour uses an inclusive 10-minute span. An anchor at least one hour old and no more than 12 hours old uses an inclusive 1-hour span. An anchor more than 12 hours old and no more than 24 hours old uses an inclusive 4-hour span. An anchor more than 24 hours old uses an inclusive 8-hour span. Exactly 12 hours uses the 1-hour tier, and exactly 24 hours uses the 4-hour tier. The frontend must preserve the API-provided group and child order and must not regroup entries across pages.

Before pagination, the backend collapses duplicate recommendations from one actor to one document and duplicate subscriptions from one actor to one publication into one logical activity. It preserves records from different actors. The earliest active source URI represents the action; if that record is deleted, a remaining duplicate may replace its URI and timestamp. This does not change the response type. Do not add client-side actor/target deduplication, because it would operate too late for correct pagination.
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
- Treat every child `activity.record` as metadata only; resolve the raw root payload through `associatedRecords[activity.record.uri].record`.
- Preserve `activity.viewerState.subscribed` when narrowing each child item.
- For `groupBy: 'subject'`, expect `subject` and no `actor`; for `groupBy: 'actor'`, expect `actor` and no `subject`.
- Use `group.indexedAt` for group-level elapsed time; child rows use their own `record.indexedAt`.
- Use `AtUri` from `@atproto/syntax` to read `activity.record.uri`'s collection and authority DID.
- Catch invalid AT URIs and render the generic fallback row.
- Use the URI collection as the primary row discriminator and confirm that required record fields have the expected primitive types before reading them.

## React Query hook

Create the camelCase file:

```text
src/state/queries/atmosphereActivity.ts
```

Export:

```ts
useAtmosphereActivityQuery()
```

The hook:

- reads `currentAccount.did` from `useSession()`;
- reads the dedicated client from `useAtmosphereClient()`;
- builds its key with `createQueryKey()` and an object containing `viewer`;
- calls `eric.bsky.atmosphere.getActivity` with:
  - `viewer: currentAccount.did`;
  - `cursor: pageParam` when present;
- does not send a limit; page sizing is server-controlled over root records; the backend returns at least 10 roots when available, extends through one-hour activity bursts, and caps a page at 200 roots; grouping can make the outer feed shorter;
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
src/screens/Activity.tsx
```

Export `ActivityScreen`, typed as a `NativeStackScreenProps<CommonNavigatorParams, 'Activity'>` screen.

Use the standard layout components:

```tsx
<Layout.Screen testID="activityScreen">
  <Layout.Header.Outer>
    <Layout.Header.BackButton />
    <Layout.Header.Content>
      <Layout.Header.TitleText>
        <Trans>Activity</Trans>
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

## Row presentation

Every top-level feed entry must produce a visually separate row, including unsupported or malformed items. Standalone items use their root activity presentation. Subject groups use the collapsed and expandable presentation below. Actor groups remain in the diagnostic phase: render each direct child inside one container in API-provided reverse-chronological order and give that container a two-pixel red border. Group children are not recursively rendered as groups. Rows use standard ALF atoms and theme values:

- horizontal and vertical padding consistent with other feed rows;
- a bottom or top separator using `t.atoms.border_contrast_low`;
- the root actor's avatar when `actors[rootDid].avatar` is available;
- an avatar placeholder when the actor or avatar is unavailable;
- translated sentence text;
- `TimeElapsed` using `group.indexedAt` for a group and `activity.record.indexedAt` for an item;
- `emoji` on text that can contain actor or record-provided values.

For grouped activity, preserve every child item's viewer state and resolve each child's raw root record and actor from the shared sidecars. A subject group may summarize multiple actors targeting one document or publication; an actor group may summarize one actor's activity in one collection. The opaque `group.id` is a list key only and must not be parsed.

### Subject group: many actors, one subject

Render `groupBy: 'subject'` as one collapsed, tappable row. The backend guarantees at most one child per actor for a recommendation/document or subscription/publication subject, so `group.items.length` is the distinct actor count. Use the newest child actor as the primary actor and summarize the remaining child count:

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

Preferred sentence:

```text
<recommender> recommended <document author>’s post <document title>
```

Example:

```text
alice.example recommended bob.example’s post Building a Small Web
```

The actor labels and title should be distinguishable with font weight, while remaining one accessible sentence.

Fallbacks:

- Missing document actor: use its authority DID.
- Missing title: use translated `Untitled post`.
- Missing or invalid `document` reference: render the generic row.

### Document

For `site.standard.document`, render:

```text
<document author> published <document title>
```

Use translated `Untitled post` if the title is unavailable. The API's `textContent` is only a filtered preview and is not required in this first row design.

### Publication

For `site.standard.publication`, render:

```text
<publication author> created the publication <publication name>
```

Use translated `Untitled publication` if the name is unavailable.

### Subscription

For `site.standard.graph.subscription`:

1. Read the root subscription's `publication` AT URI.
2. Look up the publication in the full `associatedRecords` map.
3. Read the publication's `name`.

Render:

```text
<subscriber> subscribed to <publication name>
```

Use translated `Untitled publication` when the referenced publication exists without a usable name. A missing or invalid publication reference uses the generic row.

### Livestream

For `place.stream.livestream`, render an active record without `endedAt` as:

```text
<streamer> is livestreaming <title>
```

When `endedAt` is present, calculate the elapsed duration from `createdAt` through `endedAt`, format it with the app's existing `displayDuration`, and render:

```text
<streamer> livestreamed <title> for <duration>
```

Use translated `Untitled livestream` when the title is unavailable. Invalid or negative date intervals omit the duration defensively.

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

Activity is a common authenticated screen, not a bottom tab.

### Route registration

Add:

```ts
Activity: undefined
```

to `CommonNavigatorParams`, and register:

```text
Activity -> /activity
```

in `src/routes.ts`.

Register `ActivityScreen` in `commonScreens()` with:

- translated title `Activity`;
- `requireAuth: true`.

### Drawer

Add an authenticated drawer row labeled **Activity**. Place it after Notifications and before Feeds.

- Navigate to the common `Activity` route and close the drawer.
- Add `isAtActivity` to `useNavigationTabState()` so the drawer row can render as active.
- Include `isAtActivity` in the hook's fallback check so Activity is not incorrectly reported as Home.
- Emit `nav:click` with `{item: 'activity', surface: 'drawer'}`.

Use `Atom_Stroke2_Corner0_Rounded` from `#/components/icons/Atom` for the first implementation. It may be used for both inactive and active states; active state is also communicated by the bold label.

### Desktop left navigation

Add **Activity** after Notifications and before Chat, linking to `/activity` with `navItem="activity"` and the Atom icon.

Extend `Events['nav:click']['item']` with `'activity'` so drawer and left-nav analytics remain typed. The existing `NavItem` route matching should determine the desktop active state from `/activity`.

Do not add Activity to the mobile or web bottom bar.

## Internationalization and accessibility

- Wrap every user-facing string in Lingui macros.
- Prefer `@lingui/react/macro` for new code.
- Use Unicode punctuation, including the typographic apostrophe in the English recommendation sentence.
- Keep each row's generated sentence available as a coherent accessibility label even if visual fragments use different font weights.
- Interactive retry controls require labels and useful accessibility hints.
- Rows themselves are not pressable. Only the inline actor, document, and publication links expose link semantics.
- Use `emoji` for actor labels, publication names, and document titles.

## Error behavior

Expected backend errors include an untracked viewer, invalid cursor, and unavailable backend dependencies.

- Initial request errors show a translated failure state, cleaned error text, and Retry.
- Pagination errors preserve already loaded rows and appear in the list footer with Retry.
- Pull-to-refresh errors preserve existing rows and use the app's normal query/error behavior; they must not clear successful cached data.
- Do not log expected XRPC/network failures as unexpected application errors.

## Tests

Add focused tests for behavior that carries contract risk:

### Query tests

- sends the signed-in DID as `viewer` without a caller-controlled limit;
- omits the cursor on page one and passes the returned cursor verbatim on page two;
- stops pagination when the cursor is absent;
- narrows valid `associatedRecords` and `actors` maps;
- replaces invalid map containers with empty maps.

### Row/model tests

- recommendation traverses `recommend -> document` and uses both actors plus the document title;
- subject groups summarize the primary actor plus remaining distinct-actor count, toggle between `AvatarStack` and compact avatar-and-handle rows for the remaining actors, preserve child order and viewer state, and never render nested groups;
- duplicate source recommendations or subscriptions from one actor to one target are represented once by the backend and require no frontend semantic deduplication;
- actor groups remain one outer row with a red diagnostic boundary;
- every row receives the same full merged `associatedRecords` reference;
- associated maps from multiple loaded pages are merged;
- duplicate activity URIs are rendered once in first-seen order;
- document, publication, and subscription sentences use their associated data and canonical links;
- active and ended livestreams use the correct sentence and duration;
- Grain photo records construct and display the expected CDN image URL, aspect ratio, and alt text;
- actor handles are sanitized, prefixed with `@`, and linked to profiles;
- absent actors fall back to DIDs;
- missing references and unsupported collections produce a generic row instead of being dropped.

### Session/navigation coverage

- direct local atmosphere client targets `EXPO_PUBLIC_APPVIEW_SANDBOX_URL` without a proxy header;
- default atmosphere client uses the appview-sandbox proxy service;
- session bundle and provider hook expose the same atmosphere client instance;
- route typing and navigation compile for `Activity`.

## Verification

Run the repository scripts, never their underlying tools directly:

```sh
pnpm prettier
pnpm lint
pnpm typecheck
pnpm test <focused test paths>
```

Do not run `pnpm intl:extract` or `pnpm intl:compile`.

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

1. Authenticated users can open `/activity` from both the drawer and desktop left nav.
2. The screen uses `Layout.Screen` and `Layout.Header` and is not added to the bottom bar.
3. The query explicitly sends the signed-in DID without a limit and paginates with opaque cursors.
4. Every outer feed entry renders as a separate row in API order; grouped children render within their group row.
5. Every row receives the same complete merged `associatedRecords` object for the currently loaded pages.
6. A valid recommendation renders the recommender, document author, and document title by traversing the associated-record map.
7. All six expected root collections have useful presentation, Grain photos render beneath their row headers, actor handles and document/publication titles are linked, and malformed or unknown items render a generic fallback row.
8. Loading, empty, initial-error, refresh, next-page loading, and next-page error states are usable.
9. The appview-sandbox client supports both direct local development and the deployed PDS proxy configuration.
10. New user-facing strings are translatable and the focused tests, typecheck, lint, and formatting checks pass.
