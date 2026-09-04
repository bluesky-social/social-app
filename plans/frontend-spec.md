# Activity screen frontend specification

Status: proposed

This document specifies the first frontend for the Atmosphere activity API described in [`atmosphere-api-contract.md`](./atmosphere-api-contract.md).

## Goal

Add an authenticated **Activity** screen that displays the signed-in user's Atmosphere activity as a paginated list. Add entry points named **Activity** to the mobile drawer and desktop left navigation.

Each API activity item is rendered as its own row. Every row receives the complete merged `associatedRecords` map, not only its root record, so the row can follow record references such as:

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
- basic rows for all four record collections currently allowed by the API;
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
  uri: string
  cid: string
  indexedAt: string
}

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
  feed: ActivityItem[]
  associatedRecords: AssociatedRecords
  actors: ActivityActors
  cursor?: string
}
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
```

Narrowing rules:

- Treat non-object `associatedRecords` and `actors` values as empty maps rather than casting blindly.
- Ignore malformed individual map entries during lookup, but do not remove their corresponding feed item from the list.
- Use `AtUri` from `@atproto/syntax` to read an item's collection and authority DID.
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
  - `limit: 30`;
  - `cursor: pageParam` when present;
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
- defensively deduplicate activity items by `uri`, keeping the first occurrence;
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
3. Flatten each page's `feed` in response order and deduplicate by activity URI.
4. Construct every row with references to the same merged maps:

```ts
type ActivityRowItem = {
  key: string
  activity: ActivityItem
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}
```

Do not copy or reduce `associatedRecords` per row. The row must receive the full merged map so it can traverse any relationship available in the loaded response data.

The merged maps may be rebuilt when query data changes; all rows produced by one list-model calculation must share those map references.

## Row presentation

Every activity item must produce a visually separate row, including unsupported or malformed records. Rows use standard ALF atoms and theme values:

- horizontal and vertical padding consistent with other feed rows;
- a bottom or top separator using `t.atoms.border_contrast_low`;
- the root actor's avatar when `actors[rootDid].avatar` is available;
- an avatar placeholder when the actor or avatar is unavailable;
- translated sentence text;
- `TimeElapsed` using `activity.indexedAt`;
- `emoji` on text that can contain actor or record-provided values.

Use the root activity URI's authority as the actor who performed the action. Resolve a referenced document or publication author from that referenced record's URI authority.

Actor labels use this fallback order:

1. actor `handle`;
2. actor `displayName`;
3. authority DID;
4. translated `Unknown user` if no DID can be parsed.

For the explicit handle-oriented sentences below, render the available label without inventing a handle. Do not suppress a row because actor hydration is missing.

### Recommendation

For `site.standard.graph.recommend`:

1. Look up the root recommendation at `associatedRecords[activity.uri]`.
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
- Rows are not pressable in this version; do not imply button or link semantics.
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

- sends the signed-in DID as `viewer` and `limit: 30`;
- omits the cursor on page one and passes the returned cursor verbatim on page two;
- stops pagination when the cursor is absent;
- narrows valid `associatedRecords` and `actors` maps;
- replaces invalid map containers with empty maps.

### Row/model tests

- recommendation traverses `recommend -> document` and uses both actors plus the document title;
- every row receives the same full merged `associatedRecords` reference;
- associated maps from multiple loaded pages are merged;
- duplicate activity URIs are rendered once in first-seen order;
- document, publication, and subscription sentences use their associated data;
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
3. The query explicitly sends the signed-in DID, requests 30 items, and paginates with opaque cursors.
4. Every feed item renders as a separate row in API order.
5. Every row receives the same complete merged `associatedRecords` object for the currently loaded pages.
6. A valid recommendation renders the recommender, document author, and document title by traversing the associated-record map.
7. All four expected root collections have useful presentation, and malformed or unknown items render a generic fallback row.
8. Loading, empty, initial-error, refresh, next-page loading, and next-page error states are usable.
9. The appview-sandbox client supports both direct local development and the deployed PDS proxy configuration.
10. New user-facing strings are translatable and the focused tests, typecheck, lint, and formatting checks pass.
