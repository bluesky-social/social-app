# Composer V2

Composer V2 is a per-session composition store with React as its view layer.
It handles threads, attachments, eager media uploads, and record planning without
putting their lifecycles inside UI components. The store, adapters, planner,
and writer are intended for the production composer, but wiring them into its
UI is deferred to a separate PR; the current integration is the developer
tester.

## Try it

Open **Settings > Developer options > Debug Composer V2**, or
`/sys/debug-composer` (`bluesky://sys/debug-composer` on native).

The tester supports initialization scenarios, post editing/reordering, up to ten
images, video/captions, GIFs, record and URL attachments, languages, labels,
explicit tags, interaction settings, upload retries, and record inspection.

**This is not a sandbox account or a fake uploader:**

- Selecting or restoring media starts real processing and blob uploads.
- **Plan records** constructs and validates records without publishing them.
  Planning can perform reads and upload card/GIF thumbnails.
- Publishing is separate: an opt-in checkbox and explicit button send the exact
  plan to the PDS. The tester permits one write attempt per mount.
- Full generated records and external-preview fields are intentionally visible
  in the tester, but are not automatically logged. The state summary is redacted.
- Nothing entered here is saved as a draft. The draft scenario exercises only
  the inbound adapter.

See [tester coverage](../../view/screens/DebugComposer/COVERAGE.md) for controls,
test IDs, and the recorded UI verification scope. Unit-test coverage is not proof of live UI behavior.

## Mental model

```text
ComposerOpts -> composerOptsToInitialState() --+
                                              +-> ThreadStoreInitialState
Saved draft + media -> draftToInitialState() --+            |
                                                           v
                                                    createThreadStore()
                                                           |
                                            actions / snapshots / subscriptions
                                                           |
                                                      React hooks

Captured snapshot -> planComposerV2() -> validated plan -> writeComposerV2Plan()
                       no record writes                    explicit record write
```

There is one store per open composition. Posts have stable IDs, and their order
is the insertion order of `state.posts`. Reordering changes that order, not the
identity of posts, media, or their background work.

Each post has plain text, languages, self-labels, explicit tags, and two slots:

| Slot                 | Contents                                                    |
| -------------------- | ----------------------------------------------------------- |
| `attachments.record` | One quoted post, feed, list, or starter pack                |
| `attachments.media`  | One images group, video, GIF, external card, or chat invite |

Both slots can coexist. The planner combines them into `recordWithMedia`; the
store never uses submit-time priority to discard competing attachments. One to
four images publish as `app.bsky.embed.images`; five to ten publish as
`app.bsky.embed.gallery`. Ten is the product limit, regardless of larger schema
ceilings. A reply target is separate from both attachment slots.

Threadgate and postgate settings are shared across the composition.
`threadgateAllowRules: undefined` means everybody can reply; `[]` means nobody.
Empty postgate embedding rules allow quoting. Preserve unknown typed rules,
rather than silently broadening permissions when editing known rules.

## Working with the store

Use the [types](store/types.ts) and [store implementation](store/index.ts) as the
API reference. A session owner supplies clients, the account PDS URL,
localization, and optional normalized initial content:

```ts
import {createThreadStore} from '#/components/ComposerV2/store'

const store = createThreadStore({
  resolvers: {appviewClient, chatClient},
  pdsClient,
  pdsUrl, // currentAccount.pdsUrl ?? currentAccount.service
  i18n,
  initialState: {posts: [{text: 'Hello world'}]},
  onError, // Optional per-session reporting policy.
})

const [postId] = Object.keys(store.getState().posts)
store.actions.setPostText(postId, 'Updated text')
const added = store.actions.addPost('after', postId)
if (added) store.actions.setPostText(added.addedPostId, 'Second post')

// The session owner calls this on replacement or unmount.
store.destroy()
```

Create the store once per session, not on every render. Provide it with
`ThreadStoreProvider`; use `useThreadState()` for thread-wide subscriptions,
`useThreadPost(postId)` for a post, and `useThreadStore()` for commands.
The provider distributes the store; it does not own its lifecycle.
[The tester session hook](../../view/screens/DebugComposer/useTesterSession.ts)
is the integration example.

Use `actions` to edit. Treat published snapshots as read-only and keep focus,
dialog state, callbacks, and publish state outside the store. `internalActions`
is a test seam, not an alternative UI API. Native text inputs use `defaultValue`
and mirror changes into the store; session replacement remounts them by key.

Rich text is derived, not stored. `useThreadPostRichText()` provides regex-only
facet detection and a URL-shortened grapheme count for responsive feedback.
The planner uses the shared [`resolveRichText`](../../lib/api/rich-text.ts) path
for authoritative facets, mention resolution, newline normalization, and URL
shortening. Explicit tags are independent of hashtag facets.

## Where to make changes

| Concern                                                   | Start here                                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| State, commands, ownership, async coordination            | [store/index.ts](store/index.ts), [store/types.ts](store/types.ts), [store/utils/](store/utils/)                        |
| Real image/video workers and dependency injection         | [store/uploads.ts](store/uploads.ts)                                                                                    |
| Composer intents and inbound drafts                       | [adapters/index.ts](adapters/index.ts)                                                                                  |
| React subscriptions and text derivation                   | [hooks/](hooks/)                                                                                                        |
| Preflight, embeds, reply chains, gates, record validation | [planner.ts](planner.ts)                                                                                                |
| Sending an already successful plan                        | [writer.ts](writer.ts)                                                                                                  |
| Per-session diagnostic contract                           | [errors.ts](errors.ts)                                                                                                  |
| Developer controls and session/attempt lifetime           | [tester](../../view/screens/DebugComposer/DebugComposer.tsx), [debug route](../../view/screens/DebugComposer/index.tsx) |

## Planning, writing, and errors

`planComposerV2({snapshot, dependencies, preflight, onError})` returns either
`{ok: true, input, posts, writes}` or `{ok: false, errors}`. It captures one
immutable snapshot; it does not wait for pending uploads or incorporate later
edits/completions. Plan again from a fresh snapshot when necessary.

`writeComposerV2Plan({plan, pdsClient, onError})` checks the authenticated account
against `plan.input.repo`, requires `validate: true`, and sends exactly one
unchanged `applyWrites` request. It returns planned post URIs in thread order.
It does not rebuild the composition or retry. The legacy `apilib.post()` is not
a reusable executor: it constructs records from the legacy draft model itself.

**A rejected write may already have committed.** Retain the exact plan and
reconcile its URIs; do not automatically replan with new keys or retry. The
tester retains the attempted plan in memory, including across scenario changes,
but has no reconciliation engine or durable plan storage. Leaving the tester
loses that in-memory record. Future production integration must also own duplicate
submission protection, publish state, AppView propagation, and video telemetry.

Failures remain in attachment/upload state, adapter rejections, or planning and
writing outcomes. Optional `onError(event, cause?)` adds one per-session reporting
policy, not a global toast or event bus. Pass `store.reportError` to operation
callers, with an attempt guard when work can be superseded. Diagnostic causes
are not safe UI text or automatic logging payloads.

## Follow-ups, not part of this composer PR

- **Image compression extraction:** handled separately on the main-based
  `composer-image-compression-extraction` branch. Until integrated, the worker
  still lazily imports the gallery compressor. After rebasing onto the extraction,
  switch to the UI-free static import, preserve dependency injection, and rerun
  worker/import-boundary checks. This README does not claim that integration is
  complete.
- **Draft save/restore:** inbound hydration exists; outbound serialization,
  persistence, cleanup, and tester Save/Open controls are deferred to a separately
  authorized follow-up branch. The design is recorded below and in the local
  task `AGENTS/tasks/0008-task-composer-v2-draft-round-trips.md`, if present.
- Production composer UI wiring is deferred to a separate PR. A production tag
  typeahead and dormant external-card suggestions are not scheduled. The
  tester's tags are intentionally a plain comma-separated input, not a
  suggestions service.

---

## Agent and maintainer reference

The sections below preserve the architectural decisions and implementation
context from the former planning documents. They are constraints and reference
material, not authorization to start deferred work. Completed task files have
been removed from the local queue; only the deferred drafts task remains.
`AGENTS/` is normally globally ignored local workspace data. Do not force-add it
or recreate an execution-order manifest as part of composer changes.

### State ownership and action contracts

- The thread owns `posts`, `replyTo`, `threadgateAllowRules`,
  `postgateEmbeddingRules`, `draftId`, and `isDirty`. Each post owns text,
  languages, labels, tags, attachment slots, and derived picker capacities.
- Initial builders generate post/media IDs, copy editable inputs, and compute
  capacities before eager work begins. Missing/empty initial `posts` creates one
  empty post; empty image input creates no attachment. More than ten initial
  images fails before workers start rather than truncating the composition.
- Adapters normalize without becoming a second ownership boundary. The store
  copies editable arrays and nested rules/reply data. Caller-supplied views and
  media metadata must be treated as immutable. Do not mutate returned snapshots;
  runtime freezing/readonly enforcement is not an implemented guarantee.
- Mutations preserve structural sharing: replace touched branches, not every
  post. Recognized no-ops return without publishing or notifying; do not assume
  every setter performs semantic equality checks.
- `addPost(position, postId)` returns `{addedPostId}` only on insertion.
  `addMedia(postId, inputs)` returns accepted `{addedMediaIds}`, including `[]`
  for a valid no-op; absent targets/destroyed stores return `undefined`. Selection
  filters enforce compatibility/capacity; IDs must not describe rejected items.
- `movePost(postId, toIndex)` uses the desired final zero-based index and returns
  `{movedPostId}` on a real move. Invalid/missing/same-position/destroyed cases
  return `undefined`. Only the posts map order changes; post objects and their
  async ownership remain intact.
- `retryAllFailedUploads()` returns `{retriedMediaIds}`. It captures eligible
  image/video failures in thread order and rechecks live eligibility before
  retrying. Neither individual nor bulk retry restarts pending, active, completed,
  terminal, removed, or destroyed work. Retained retry closures become inert
  once their particular failure is superseded.
- User edits dirty content; initialization, worker progress, URI completion, and
  retries do not. Draft-save acknowledgement/content-revision tracking is not yet
  implemented.
- `internalActions.setUploadStatus` exists for tests only and calls the private
  `applyUploadStatus` directly. Worker callbacks named `setUploadStatus`,
  `setMediaCompressionResult`, and `setCaptionBlobs` are a different interface:
  they pass through task-identity guards before reaching the private
  `apply*` writes. Keep `getState`, `subscribe`, `destroy`, and `reportError`
  as lifecycle/read/reporting methods, not UI mutation shortcuts.
- Naming inside `createThreadStore`: `set*`, `add*`, `remove*`, `update*`, and
  `retry*` are public actions; `apply*` functions are private state writes
  reached from guarded worker callbacks; `replace*` functions return an updated
  post copy without touching the store.
- There is one store implementation in `store/`. The superseded parallel `lib/`
  implementation was removed; do not revive it.

### Attachment and asynchronous ownership

Settled attachments block incoming URI candidates; pending/failed candidates can
be superseded. Explicit record setters replace the record. Removing selected
media does not restore an old suggested card: no dormant suggestion is stored.
Record and media destinations must remain independent, even for unclassified
URLs that initially reserve a chosen lane and are later resolved.

URI resolution uses separate per-post revisions for the record and media slots.
Replacing/removing one slot invalidates its work, not the other slot's work.
Retries preserve destination ownership. A stale result must neither overwrite
current data nor resurrect a removed attachment.

Upload tasks are keyed by stable media ID. The registered task object's identity
is the stale-callback token. Register it before invoking a worker: injected
workers can report synchronously. Removal/replacement/retry/destruction must
invalidate ownership before late callbacks can act. Reordering must not cancel
or reassign this work. `destroy()` cancels owned tasks, invalidates resolution,
clears subscribers, and disables session reporting. Caller-owned planning and
scenario promises still need their own attempt/session guards; destruction does
not physically abort every external operation.

Worker-reported `UploadStatus` failures allow `retryable?: boolean`; omission
retains the existing retryable default. Stored `PostMediaUploadStatus` failures
are explicit variants:

```ts
// Combined with error/code and any retained video/caption blob data.
type FailedUploadRetry =
  | {state: 'failed'; retryable: true; retry: () => void}
  | {state: 'failed'; retryable: false; retry?: never}
```

Normalize this at the store boundary without a cast hiding incompatible states.
Allowed retry is not automatic retry and does not promise the next attempt will
succeed. Empty/overlength text and pending/failed attachments are valid editing
states, not store corruption; publication preflight handles readiness.

### Media workers and platform boundaries

`pdsClient`, `pdsUrl`, and `i18n` are required store options; a caller without
an account must not construct a store. `pdsUrl` is the account PDS URL, which
video uploads use for the service-auth audience; the shared video API still
names it `dispatchUrl`, so the worker maps it at that call. Tests can inject
compression, metadata, upload, service-client, and polling/sleep overrides via
`__uploadOverrides`, and whole workers via `__uploadWorkers`. There is no
production simulated-upload fallback. Use the current lex clients, not removed
agent APIs.

**Images:** retain original source fields; compress with the existing
`compressImage` and `IMAGE_SIZE_CONFIG_POSTS`; retain prepared path/MIME/dimensions
separately; upload through the platform PDS blob helper. The compressor has no
abort signal: cancellation is logical, its late result is ignored, and a
cancelled compression must not start the following upload. Do not duplicate the
compression policy. The separate extraction removes the gallery/picker/Toast/
ALF/bottom-sheet import chain; importing the store must remain usable in tests
without mounting UI or faking native `Platform.Version` to hide that coupling.

**Video:** validate metadata, duration, dimensions, MIME, and account limits;
reuse the production compressor and `uploadVideo()` wrapper around
`uploadVideoMultipart()`, not the legacy component reducer. Preserve service-auth
audience handling, byte progress, missing-part recovery, token refresh,
cancellation/remote abort cleanup, immediate completed jobs, and bounded status
polling. Observable worker phases are `validating`, `compressing`, `uploading`,
`processing`, and `captions`, as applicable; they are not all separate top-level
upload states.

Editable captions are `{lang, content}`; uploaded caption blobs are separate.
A completed video survives a later caption-upload failure. `setVideoCaptions`
keeps blobs only for unchanged language/content, restarts running/completed work
when necessary, and allows the worker to reuse the video and unchanged captions.
Prepared outputs do not retain multipart controllers or transient web buffers.

### Adapter fidelity

Both adapters return `ThreadStoreInitialState`; neither constructs a store,
dispatches corrective edit actions, loads/saves/deletes draft files, resolves
remote views, or starts uploads. Metadata probes are narrow injectable seams.
Runtime IDs, retry functions, task state, revisions, moderation objects, and
shell callbacks do not belong in normalized content. Web picker Blob input is a
runtime source convenience, not a persisted draft representation.

`composerOptsToInitialState({composerOpts, ...options})`:

- Preserves initial text/Unicode/whitespace; nonempty explicit text takes
  precedence over mention-generated text using the existing mention helper.
- Detects at most one record and one media URL from initial facets. Explicit
  quote/local media wins over detected candidates; explicit image plus video
  is rejected. A quote can coexist with images, video, or an external card.
- Preserves supplied quote strong ref/view without refetching. Image order,
  dimensions and alt text survive; video MIME/metadata comes from the platform
  probe, not an unreliable extension guess.
- Keeps `openGallery`, `onPost`, `onPostSuccess`, logging context, close behavior,
  and auth/block checks with the shell caller. No existing shell API migration
  is implied by this adapter.
- Retains a moderation-free reply parent preview: URI/CID, text, languages,
  author, and optional embed. It does not fabricate a thread root or infer a
  reply from an embedded quote. New-composition gate defaults come from the
  caller's `postInteractionSettings` preference.

`draftToInitialState({draftId, draft, loadedMedia, ...options})`:

- Preserves post order/text/self-labels, applies top-level `draft.langs` to each
  post, and starts with the draft ID and `isDirty: false`.
- Uses saved gate fields rather than account defaults. Absent fields mean
  protocol defaults; unknown typed gate rules remain intact.
- Reads legacy `embedImages` before `embedGallery` items, without deduplicating
  refs or copying source files. Looks up `localRef.path` in the caller's media
  map and probes dimensions. The combined ten-image limit still applies.
- Restores video source/MIME/dimensions/local ref, alt text, and caption content
  using existing MIME-in-local-ref conventions and metadata fallback.
- Recognizes Tenor/Klipy GIF URL conventions, including dimensions and custom
  alt text, without turning arbitrary `.gif` URLs into provider GIFs. Ordinary
  external URLs become record/media candidates by recognized URL kind.
- Classifies strong refs by AT-URI collection (post/feed/list/starter pack),
  not by assuming every record is a quote; known refs are not fetched again.
- Throws `ComposerAdapterError` for missing media/metadata, overflow, conflicting
  slots, unsupported records/gallery entries/labels, or other lossy conversion.
  A rich draft must not silently become a successful text-only restoration.

Supplied resolved attachment views are trusted for the session. Resolve missing
data only; do not force-refresh them before publication. If a reference becomes
invalid, surface the operation's failure rather than silently changing content.

### Planner and writer invariants

- The planner captures published snapshot references before awaiting; it does
  not defensively clone the entire composition or consult live state later.
  Pending/failed work returns structured errors. Caller tokens suppress stale
  plan results; the tester marks a result stale by snapshot identity.
- Reject all-empty compositions. Drop trailing empty posts; require
  `skipEmptyPostsConfirmed` before skipping non-trailing empty posts. Tags-only
  and attachment-only posts are not empty. `requireAltText` is caller policy
  (normally from preferences), not a lexicon constraint.
- Use shared rich-text preparation: authoritative mention facets, invalid-mention
  stripping, newline cleanup, shortened URLs, and final grapheme validation.
  Preserve explicit tags separately and validate their generated-lexicon limits.
- Use collision-resistant `TID.next` keys; `__createRkey` is a test-only seam.
  Validate TID syntax and uniqueness among posts in each plan. Compute CIDs and
  final AT URIs so each subsequent post replies to its predecessor, retaining
  the original root. External reply roots/authoritative parent refs come from
  AppView, not the preview.
- Build active embeds only: images for 1-4, gallery for 5-10, video with caption
  blobs, external/GIF/chat-invite cards, records, or record-with-media. Preserve
  custom GIF alt text. Card/GIF thumbnail uploads are allowed during planning;
  post/gate writes are not.
- Emit a threadgate for the first planned post when allow rules are defined,
  including `[]`; do not create one when everyone may reply. Emit a postgate
  for every planned post when shared embedding rules are nonempty. Gates reuse
  their post's rkey in a different collection and its final URI/time.
- Validate each generated record and the whole `applyWrites` input. Return full
  planned records and refs plus structural summaries; do not automatically log
  record contents, local paths, captions, credentials, views, or raw exceptions.
- The writer requires a successful plan, matching authenticated DID/repo, and
  `validate: true`. It sends one unchanged request and returns ordered URIs.
  Preserve SDK failures exactly. Any rejection after dispatch, including a
  transport abort, conservatively requires reconciliation; no automatic retry.
- Keep planner no-write tests at the real dependency boundary, not merely a
  mock of the entire planner. Writer tests must assert the exact request and
  absence of a second call on failure. Publishing remains an explicit caller
  operation, never a side effect of editing, planning, or saving a draft.

### Error reporting and React integration traps

`ComposerV2OnError(event, cause?)` is optional and synchronous. Structural events
carry a source, stable code, kind (`validation`, `operational`, `unexpected`),
local post/media IDs where applicable, and recovery (`retry`, `edit`, `reconcile`,
`none`). The untrusted diagnostic cause is a separate argument.

- Register the policy before initialization/eager work. Adapters can receive
  the policy before a store exists; later operations can use `store.reportError`.
  Report at one owning boundary, not again when catching its rejection.
- Report accepted failures once per attempt, not on renders, progress, or reads
  of an already failed snapshot. A newly failed retry is a new report. Ignore
  cancelled/stale/destroyed work, except dispatched write failures whose outcome
  may be uncertain. Supersedable callers guard their attempt/session tokens.
- Callback exceptions cannot replace operation outcomes, interrupt cleanup, or
  recursively produce reporting failures. State/results/rejections remain the
  authority; this is not a replacement error channel.
- Ordinary planner preflight and record-validation errors remain local results.
  Unexpected planner causes are retained non-enumerably, outside serialized
  results. URI state contains a safe fallback/code rather than raw exception
  messages; UI translates stable codes. Do not forward every validation result
  to crash reporting or a global toast.
- Reset/account replacement/unmount retire old stores and invalidate async
  scenario/plan work. Deferred scenario stores must be destroyed, not orphaned.
- Native dialogs can portal into a separate root outside the screen provider.
  Store-reading dialog content must re-provide its owning `ThreadStore` inside
  `Dialog.Outer`; the portal regression test exercises this. The shared gate
  dialog stays mounted so its control is attached before the first open.
- Keep Lingui macros at compilable call sites. Passing a tagged-template macro
  binding into an ordinary helper previously produced broken gate/error text;
  use the tested message hooks. Do not add typeahead or elaborate tags UI.
- Synthetic draft fixtures must not contain fabricated network-bearing GIF/card
  URLs that real workers could fetch. Use local test doubles for those cases.

### Deferred draft design

Implement on a separately authorized follow-up branch, not this composer PR or
the compression-extraction branch. Inbound conversion is complete, but that is
not outbound persistence. Re-audit the schema before implementation.

**Codec:** add a UI-free V2 serializer returning draft data and a local-media
manifest, then reuse authenticated draft endpoints and native/web storage.
Do not convert to legacy `ComposerState` just to call its save hook. Restore only
through `draftToInitialState()` and the constructor. Preserve ordered posts,
labels, supported languages/gates, record/media combinations, alt text and
captions. Write `embedGallery` for images while reading both draft image shapes.

**Schema gaps:** the current draft schema lacks explicit tags and reply targets,
and has only thread-wide languages. External previews persist as URLs, not full
metadata. Prefer proper schema/API support for tags/replies/per-post languages
before claiming full fidelity; coordinate that separately, never hand-edit
generated lexicons or invent wire fields. Until supported, return a specific
representability error instead of discarding content or flattening different
languages. A local sidecar is not the default solution: it gives different
meaning to the same remote draft across devices/clients and needs an explicit
decision. Reconstruct previews; do not promise identical metadata forever.

**Media:** saving must not require successful uploads if a usable local source
exists. Persist editable bytes, not upload status/functions, multipart sessions,
temporary URLs, or publication plans/keys. Reuse unchanged durable refs; do not
overwrite a ref still needed by an older draft or another owner. Remote blobs
cannot replace editable local sources. Web IndexedDB stores bytes; a transient
File/blob URL in state is not proof of persistence. Restore fresh runtime state
and eager workers, with safe same-session reuse where available.

**Save sequencing:** capture an immutable snapshot and content revision;
serialize/check representability; stage new media non-destructively; save remotely;
adopt the draft ID and saved revision only after both succeed; then clean up only
refs proven unneeded by saved data, the live session, or another owner. The legacy
hook currently saves remotely before copying local media: do not inherit that
ordering blindly. These stores are not one atomic transaction. Failed/ambiguous
saves must retain media required by either the old or possibly updated draft;
never blindly delete files or repeat an uncertain create.

**Concurrent edits:** serialize saves per session. A successful save adopts its
draft ID but must not clear newer edits. Compare a content revision, not whole
snapshot identity (upload progress also changes snapshots). Retired sessions and
account changes must not apply acknowledgements to a replacement store. Use the
session reporting contract without sensitive logging or double reporting.

**Scope and tests:** add simple tester Save/Open controls; leave production UI
and existing explicit publication behavior unchanged. Metadata is remote, but
media remains device-local (native files/IndexedDB); report missing/other-device
media instead of silently dropping it. Cross-device media sync is out of scope.
Test semantic round trips, Unicode/order, 1/4/5/10 images, legacy galleries,
video/captions/GIFs, quotes/records/cards, gates, original/prepared sources,
ref reuse/ownership, pending/failed uploads, unsupported fields, runtime-data
exclusion, partial/ambiguous saves, concurrent edits, account replacement,
cleanup, and platform storage with disposable fixtures and fake clients.

### Verification workflow

Use repository scripts, not underlying Jest/TypeScript/Oxlint/Prettier commands:

```sh
pnpm test src/components/ComposerV2 src/view/screens/DebugComposer --watchman=false --runInBand
pnpm typecheck
pnpm lint
git diff --check
```

Add affected helper/storage tests through `pnpm test`; shared video changes also
need `pnpm test src/lib/media/video --watchman=false --runInBand`. Useful suites:

- `store/__tests__/`: actions, capacities, ownership, notifications, hydration,
  gates/tags, media/captions/reordering, and diagnostic boundaries.
- `sequences.test.ts`: four reproducible seeds (`7`, `42`, `2025`, `0xc0ffee`),
  60 operations each, plus explicit stale-callback scenarios. Keep operation
  traces reproducible; avoid a duplicate store model or new framework by default.
- `adapters/__tests__/`: source fidelity, conversion errors, and initialization.
- `planner.test.ts` / `writer.test.ts`: preflight, reply/CID/key safety, rich text,
  embeds, gates, lexicon validation, no-write planning, and exact writer calls.
- [`DebugComposer/__tests__/`](../../view/screens/DebugComposer/__tests__/):
  session/attempt lifetime, separate-root portals, compiled translations,
  inline tags, full inspection, and retained plan behavior.

For scoped formatting, inspect the current `pnpm prettier` script: it includes
`--check .`. Never append `--write` to an unrestricted root scan. Create a
temporary ignore file at the repo root, for example:

```gitignore
**/*
!*/
!src/components/ComposerV2/README.md
```

Add exact negated paths for each touched file, then run:

```sh
pnpm prettier --write --ignore-path .composer-v2-format.ignore
pnpm prettier --ignore-path .composer-v2-format.ignore
```

Remove the temporary file afterward. If shell wrappers obscure results, capture
the same required pnpm scripts via a Node child process into temporary logs and
report actual exit statuses. Do not substitute direct underlying tools. Do not
run i18n extraction/compilation or edit generated lexicons incidentally.

Mocked tests do not establish device uploads or cross-platform UI acceptance.
Use the applicable Argent skills and explicitly authorized test accounts/media
for live verification; never publish or use operator media just to test a change.
Keep evidence scoped to what actually ran, and report unrelated failures without
expanding scope. Do not stage, commit, start another task, or migrate production
UI without authorization.

### Historical context, not an execution queue

This README replaces the implementation plan, architecture document, milestone
history, archived adapter brief, and follow-up discussions formerly under the
root planning directory. Their future-tense instructions and old test counts
are not current work orders or fresh validation results.

| Completed stage              | Context preserved from the original reports                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Record/media slots           | Replaced competing quote/embed/media structures; slot-local races and snapshot isolation covered. Reported 115 tests.                               |
| Normalized initial state     | Direct complete first snapshot, fresh IDs, clean hydration, reject image overflow. Reported 148 tests.                                              |
| Intent/draft adapters        | One input contract, serializable reply preview, faithful media/gates and typed lossy-input errors. Reported 159 tests.                              |
| Shared gates and ownership   | Undefined/empty semantics and opaque rules, with copying at store boundaries rather than redundant adapter copies. Reported 167 tests.              |
| Ten-image capacity           | Product limit established before planner gallery output. Reported 118 tests in that earlier stage.                                                  |
| Real eager workers           | Replaced simulated workers; image/PDS and multipart video/caption paths. Reported 173 ComposerV2 tests and 41 video tests; all platform typechecks. |
| Later completed capabilities | Named action results, bulk retry, URI-lifecycle cleanup, post reordering, validated planning, explicit tags, tester inspection, and thin writer.    |
| Upload failure contracts     | Explicit stored retryable/terminal variants; no cast concealing a missing retry function.                                                           |
| Action-sequence coverage     | Fixed active/stale retry attempts alongside seeded sequences and caption-retry integration; reported 319 tests (`1aa1a4d8ec41`).                    |
| Session error reporting      | Structural callback, diagnostic separation, attempt guards and uncertain-write handling; reported 357 tests (`4367608196eb`).                       |
| Public/internal actions      | Low-level status mutation moved to a documented test seam, leaving intended editing commands public (`985cd1865fe7`).                               |

Early stages used simulated uploads; those historical constraints ended with the
real workers. The initial submission milestone deliberately stopped at planning;
the later writer and explicit tester publisher supersede the old no-publishing
scope, without changing the planner's no-write guarantee. Production migration
was dropped in favor of a utility tester, not a polished replacement composer.

Legacy milestone numbers were not task IDs: reordering #8 became task 0005,
record planning #9 (including gallery output #5) became 0006, UI #10 became the
tester task 0007, and drafts #6 became 0008. Cleanup tasks 0001-0003 and later
0009-0012 are complete. Compression 0004 moved to its own main-based branch;
drafts remain deferred. Do not reconstruct the obsolete queue from these IDs.

Historical device evidence included iOS tester entry, text/grapheme feedback,
comma-separated tag parsing into a successful plan, and full external-record
inspection. Those reports did not establish full native-dialog, keyboard,
Android/web, or production-publish acceptance. Old suite counts, warning totals,
and harness display quirks are historical evidence only; rerun relevant checks
for new changes rather than treating them as a release certification.
