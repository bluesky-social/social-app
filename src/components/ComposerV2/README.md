# Composer V2

Composer V2 is a per-session composition store with React as its view layer.
It handles threads, attachments, eager media uploads, and record planning without
putting their lifecycles inside UI components. The store, adapters, planner,
and writer are intended for the production composer, but wiring them into its
UI is deferred to a separate PR; the current integration is the developer
tester.

## Try it

Open **Settings > Developer options > Debug Composer V2**, or
`/sys/debug-composer` (`bluesky://sys/debug-composer` on native). It requires a
signed-in account; signed out, it shows a notice instead of creating a store.

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
test IDs, and what has been verified by hand. Unit-test coverage is not proof of
live UI behavior.

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
localization, analytics, and optional normalized initial content:

```ts
import {createThreadStore} from '#/components/ComposerV2/store'

const store = createThreadStore({
  resolvers: {appviewClient, chatClient},
  pdsClient,
  pdsUrl, // currentAccount.pdsUrl ?? currentAccount.service
  i18n,
  analytics, // useAnalytics()
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
The planner uses the shared [`resolveRichText`](utils/resolveRichText.ts) path
for authoritative facets, mention resolution, newline normalization, and URL
shortening. Explicit tags are independent of hashtag facets.

## Where to make changes

| Concern                                                   | Start here                                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| State, commands, ownership, async coordination            | [store/index.ts](store/index.ts), [store/types.ts](store/types.ts), [store/utils/](store/utils/)                        |
| Upload attempt lifetimes, retained compression, telemetry | [store/mediaUploads.ts](store/mediaUploads.ts), [retained compression](store/utils/createRetainedCompressionCache.ts)   |
| Real image/video workers and dependency injection         | [store/uploads.ts](store/uploads.ts), [store/uploadDependencies.ts](store/uploadDependencies.ts)                        |
| Media source preparation and paste/drop inputs            | [store/prepareMediaSource.ts](store/prepareMediaSource.ts), [adapters/pastedMedia.ts](adapters/pastedMedia.ts)          |
| Composer intents and inbound drafts                       | [adapters/index.ts](adapters/index.ts)                                                                                  |
| React subscriptions and text derivation                   | [hooks/](hooks/)                                                                                                        |
| Preflight, embeds, reply chains, gates, record validation | [planner.ts](planner.ts)                                                                                                |
| Post text preparation shared with the legacy composer     | [utils/resolveRichText.ts](utils/resolveRichText.ts)                                                                    |
| Sending an already successful plan                        | [writer.ts](writer.ts)                                                                                                  |
| Per-session diagnostic contract                           | [errors.ts](errors.ts)                                                                                                  |
| Developer controls and session/attempt lifetime           | [tester](../../view/screens/DebugComposer/DebugComposer.tsx), [debug route](../../view/screens/DebugComposer/index.tsx) |

## Planning, writing, and errors

`planComposerV2({snapshot, dependencies, preflight, onError})` returns either
`{ok: true, input, posts, writes}` or `{ok: false, error}`. It captures one
immutable snapshot; it does not wait for pending uploads or incorporate later
edits/completions. Plan again from a fresh snapshot when necessary.

`writeComposerV2Plan({plan, pdsClient, onError})` checks the authenticated account
against `plan.input.repo`, requires `validate: true`, and sends exactly one
unchanged `applyWrites` request. It returns planned post URIs in thread order.
It does not rebuild the composition or retry.

**A rejected write may already have committed.** Retain the exact plan and
reconcile its URIs; do not automatically replan with new keys or retry. The
tester retains the attempted plan in memory, including across scenario changes,
but has no reconciliation engine or durable plan storage. Leaving the tester
loses that in-memory record. Future production integration must also own duplicate
submission protection, publish state, and AppView propagation. After a write
resolves, call `store.reportPublished({plan})` so video telemetry records
publication; for a rejection that is not a `ComposerV2WritePreconditionError`,
call `store.reportPublishUncertain({plan, cause})` instead.

Failures remain in attachment/upload state, adapter rejections, or planning and
writing outcomes. Optional `onError(event, cause?)` adds one per-session reporting
policy, not a global toast or event bus. Pass `store.reportError` to operation
callers, with an attempt guard when work can be superseded. Diagnostic causes
are not safe UI text or automatic logging payloads.

## Follow-ups, not part of this composer PR

- **Draft save/restore:** inbound hydration exists; outbound serialization,
  persistence, cleanup, and tester Save/Open controls are deferred. The design
  is under [Deferred draft design](#deferred-draft-design).
- Production composer UI wiring is deferred to a separate PR. A production tag
  typeahead and external-card suggestions are not planned. The tester's tags
  are a plain comma-separated input.

---

## Reference

Constraints and contracts behind the code above. They are not authorization to
start the deferred work.

### State ownership and action contracts

- The thread owns `posts`, `replyTo`, `threadgateAllowRules`,
  `postgateEmbeddingRules`, `draftId`, and `isDirty`. Each post owns text,
  languages, labels, tags, attachment slots, and derived picker capacities.
- Initial builders generate post/media IDs, copy editable inputs, and compute
  capacities before eager work begins. Missing or empty initial `posts` creates
  one empty post; empty image input creates no attachment. More than ten initial
  images fails before workers start rather than truncating the composition.
- The store copies editable arrays and nested rules/reply data. Treat
  caller-supplied views and media metadata, and returned snapshots, as
  immutable; nothing freezes them at runtime.
- Mutations preserve structural sharing: replace touched branches, not every
  post. Recognized no-ops return without publishing or notifying; setters do not
  all perform semantic equality checks.
- `addPost(position, postId)` returns `{addedPostId}` only on insertion.
  `addMedia(postId, inputs)` returns accepted `{addedMediaIds}`, including `[]`
  for a valid no-op; absent targets and destroyed stores return `undefined`.
  Selection filters enforce compatibility and capacity, so IDs never describe
  rejected items.
- `movePost(postId, toIndex)` uses the desired final zero-based index and returns
  `{movedPostId}` on a real move. Invalid, missing, same-position, and destroyed
  cases return `undefined`. Only the posts map order changes; post objects and
  their async ownership stay intact.
- `retryAllFailedUploads()` returns `{retriedMediaIds}`. It captures eligible
  image/video failures in thread order and rechecks live eligibility before
  retrying. Neither individual nor bulk retry restarts pending, active,
  completed, terminal, removed, or destroyed work.
- `retryAttachment(postId, slot)` takes `'record'` or `'media'`. It re-resolves
  the slot's same URI only while that slot is a live, retryable failure (for
  example, never after `embedding-disabled`, for a slot in any other state, or
  after `destroy`). A late result from a superseded attempt is dropped.
- User edits dirty the content; initialization, worker progress, URI completion,
  and retries do not.
- `internalActions.applyUploadStatus` and `applyUploadFailure` are test seams
  that call the private writes directly, skipping the upload service's task and
  compression bookkeeping; they only write state and report errors. Workers
  instead receive one required `UploadAttempt` (see `uploads.ts`), already bound
  to its item by the upload service (`store/mediaUploads.ts`). Its callbacks
  (`reportStatus`, `reportFailure`, `setSourceMetadata`, `setCompressionResult`,
  `setCaptionBlobs`, `setVideoTelemetry`, and the compression cache pair) pass a
  single current-attempt guard there. The service's bookkeeping runs first, and
  what survives reaches the store as a `MediaUploadUpdate`, which
  `applyMediaUploadUpdate` routes to the private `apply*` writes.
  `getState`, `subscribe`, `destroy`, `reportError`, `reportPublished`, and
  `reportPublishUncertain` are lifecycle/read/reporting methods, not UI mutation
  shortcuts.
- Naming inside `createThreadStore`: `set*`, `add*`, `remove*`, `update*`, and
  `retry*` are public actions; `apply*` are private state writes reached from
  `applyMediaUploadUpdate`; `replace*` return an updated post copy without
  touching the store.

### Attachment and asynchronous ownership

Settled attachments block incoming URI candidates; pending or failed candidates
can be superseded. Explicit record setters replace the record. Removing selected
media does not restore an old suggested card. Record and media destinations stay
independent, even for unclassified URLs that reserve a lane and resolve later.

URI resolution runs through a ComposerV2-independent resolver
([store/linkResolver.ts](store/linkResolver.ts)) keyed per post and slot, so
replacing or removing one slot cancels only its own work. A superseded or
cancelled request resolves to nothing, so a stale result can neither overwrite
current data nor resurrect a removed attachment. The resolver also classifies
failures (permanent `embedding-disabled` versus retryable `unknown`); a
synchronous resolver throw is treated like a rejection.

Upload tasks are keyed by stable media ID, and the registered task object's
identity is the stale-callback token. Register it before invoking a worker,
because injected workers can report synchronously. Removal, replacement, retry,
and destruction must invalidate ownership before late callbacks can act.
Reordering never cancels or reassigns this work. `destroy()` cancels owned
tasks, invalidates resolution, clears subscribers, and disables session
reporting. Caller-owned planning and scenario promises need their own
attempt/session guards; destruction does not abort external operations.

Published state is plain data, with no functions. A failed `UploadStatus` or
failed `AttachmentResolution` carries a required `retryable: boolean`. Upload
workers must always set it. Retrying goes through the store actions
`retryMediaUpload(postId, mediaId)` and `retryAttachment(postId, slot)`, which
do nothing unless the target is currently a retryable failure. Allowed retry is
not automatic retry. Empty or overlength text and pending or failed attachments
are valid editing states; publication preflight handles readiness.

### Media workers and platform boundaries

`pdsClient`, `pdsUrl`, `i18n`, and `analytics` are required store options, so a
caller without an account must not construct a store. `pdsUrl` is the account
PDS URL, used for the video service-auth audience; the shared video API calls it
`dispatchUrl`, and the worker maps it at that call. Analytics carries video
telemetry. The upload service hands the workers their production dependencies
(`store/uploadDependencies.ts`), and there is no simulated-upload fallback. The
one test seam is `__uploadWorkers`, which replaces a whole worker; wrap it with
`realUploadWorkers` (`store/__tests__/uploadTestUtils.ts`) to run a real worker
with fakes.

**Images:** compress with the existing `compressImage` and
`IMAGE_SIZE_CONFIG_POSTS`, keep prepared MIME/dimensions/size separate from the
original source fields, and upload through the platform PDS blob helper. The
compressor has no abort signal, so cancellation is logical: a late result is
ignored and a cancelled compression never starts the upload. The store imports
the compressor from `#/lib/media/image/compress`, not `#/state/gallery`, so
tests need no UI or native `Platform.Version`.

**Image compression cap:** one image at a time goes through the memory-heavy
phase (dimension read when unknown, plus `compressImage`), across posts, retries,
replacements, and stores. A module-level `createConcurrencyLimit({max: 1})` in
`store/uploadDependencies.ts` is passed to the worker as the required
`limitImageCompression` dependency. Video and network uploads are unaffected.
Queued items still report `compressing`; cancelling a queued attempt removes it,
while cancelling a running one keeps the slot until its compression settles.
Tests inject their own limiter, never the singleton.

**Video:** validate metadata, duration, dimensions, MIME, and account limits;
reuse the production compressor and `uploadVideo()` (a wrapper around
`uploadVideoMultipart()`), not the legacy component reducer. Worker phases are
`validating`, `compressing`, `uploading`, `processing`, and `captions`, as
applicable; they are not all top-level upload states.

Editable captions are `{lang, content}`; uploaded caption blobs are separate. A
completed video survives a later caption-upload failure. `setVideoCaptions`
keeps blobs only for unchanged language/content, restarts running or completed
work when necessary, and lets the worker reuse the video and unchanged
captions. The store adopts the processed video blob onto the item before
captions begin, without marking the upload complete, so editing captions
mid-upload restarts from that blob.

`prepared` is display and planning metadata, not what a retry reuses. It carries
no multipart controllers, web buffers, or output URI. For a video, `size` and
`mimeType` describe the compressed output, but `width`, `height`, and
`aspectRatio` are the source's display dimensions, because `CompressedVideo`
carries none for the output. The planner rounds them to integers and omits the
embed's `aspectRatio` if either rounds to zero.

**Video telemetry** reuses `createVideoTelemetry` and the existing composer's
`video:upload:*` funnel, so V1 and V2 data stay comparable. Each attempt that
compresses gets its own telemetry and `uploadId`, created after source
preparation. A retry that reuses a retained compression result is a new attempt
(`picked`, `restarted`) with no compression events. Cancelled work records no
failure. Events V2 adds:

- `prepareFailed`: copying a restored Android video or reading source metadata
  failed. Carries the error class only, since messages can carry local paths.
- `validationFailed`: the source was rejected after `picked`.
- `restarted`: a retry or caption restart began a new attempt, with
  `previousUploadId`.
- `captionsFailed`: the video uploaded but a caption did not. A caption-only
  retry reuses the uploaded video's telemetry.
- `abandoned` carries `reason`: `'removed'` when the user removes the video, its
  attachment, or its post, `'closed'` from `destroy()`.
- `published` comes from `store.reportPublished({plan})`, which passes through
  to the upload service. The service keeps each uploaded video's telemetry in a
  `WeakMap` keyed by its blob and matches the blobs the plan embeds, so each
  video reports once and later edits cannot misattribute a publication. It
  still works after `destroy()`.
- `composer:publish:uncertain` comes from `store.reportPublishUncertain({plan,
cause})`, for a write rejected after dispatch. Those videos stay publishable
  for a later reconciliation.

### Media sources and worker preparation

Callers pass the metadata a source already has and nothing more: a URI with
optional dimensions, MIME type, duration (video, in milliseconds), and
`fileSize`. Nobody probes before `addMedia` or building initial state, and
nobody fabricates a default MIME type or dimensions. Sources:

- Picker assets (native file URIs; web data URIs for images, blob URLs plus the
  picker `File` for videos). Map every useful field, including `fileSize`.
- Composer intents (`videoUri` with dimensions only). The worker probes for the
  MIME type and duration.
- Pasted and dropped media via `pastedMediaToInput({source})`: native pasted
  file URIs and web data URIs. Pass all pasted items to one `addMedia` call so
  selection limits apply. Classification matches the existing composer: web GIF
  files use the video pipeline, native treats a pasted GIF as a still image, and
  data URI video is rejected on native. No composer text input is wired to it
  yet, and the tester exposes only the picker.
- Restored drafts via `draftToInitialState`: the loaded URI, the MIME type
  recorded in a video's local ref (`image/gif` for animated GIFs; legacy refs
  fall back to `video/mp4`), alt text, captions, and `localRefPath`. Drafts
  store no dimensions, duration, or size.
- Every image and video input has a URI. The store never creates or revokes
  object URLs; the caller that made one owns it. Restored object URLs must stay
  readable for the store's lifetime, because a retry reads the source again.

Workers own preparation (`store/prepareMediaSource.ts`). They use known values
first, then cheap sources (a web `File`'s type and size, a data URI's type, a
recognized extension, a native file stat), and run a metadata helper only for
values still missing:

- Images read dimensions with the platform image loader only when unknown. The
  compressor receives the original URI and always re-encodes to JPEG.
- Non-GIF video uses the shared video metadata helper only when MIME type,
  dimensions, or duration is missing, passing a URI on native and a `File` on
  web. A web URI-only source is fetched into a `File` only when it must be
  probed or its type is unknown, and that `File` is handed to the compressor
  rather than fetched again.
- GIF files (known type, `File` type, data URI, or `.gif` extension) never reach
  the video metadata helper, which never settles on iOS for a file without a
  video track. A source with no type information is treated as video, as the
  existing composer does.

Restored Android draft videos (items with a `localRefPath`) are read through a
simple-named cache copy (`store/utils/copyVideoToCache.ts`), because draft
storage double-encodes file names in a way the native metadata helper and
compressor cannot read. GIFs take the same copy. Each attempt owns its copy and
releases it when the attempt settles, unless a validated pass-through result
aliases it; then the retained compression entry releases it (below). The item
keeps its original URI and local ref, so draft data never points at the copy.

Prepared values reach the store through `attempt.setSourceMetadata` before source
validation. The store only fills fields the item did not know, publishes nothing
when nothing is new, and does not dirty the composition. Items never change
source except through `replaceImageSource`, so retries, caption restarts, and
reorders reuse the metadata.

#### Replacing an image source

`replaceImageSource(postId, mediaId, source)` swaps an image's source for an
editor's output, such as a crop. Crop rectangles and editor state live outside
the store; an editor crops from `item.original ?? item`.

- The first replace keeps the previous source on the item as `original`
  (`PostMediaImageSource`). Later replaces overwrite only the current source.
  `replaceImageSource(postId, mediaId, undefined)` resets to `original`, which is
  then dropped. Passing the original's own URI is a reset.
- Every current-source field is overwritten, and any the new source omits becomes
  unknown for the worker to resolve again. Alt text, id, position, and
  `localRefPath` are untouched.
- The running task is cancelled and its late results dropped. `prepared` and any
  uploaded blob are cleared, the upload returns to `pending`, and a new attempt
  starts, so a publish never uses pre-edit bytes. The composition becomes dirty.
- It returns `{supersededUri}` when an earlier edited source was discarded, `{}`
  when nothing changed (same URI, or resetting an unedited item), and `undefined`
  when the item is not a live image. The store never deletes or revokes
  `supersededUri` or `original`; the caller that created an edited file or
  object URL owns its cleanup.
- Drafts do not store `original`, so editing a restored image crops the
  already-edited file.

#### Retained compression output

The compressed video output is retained in a private runtime cache owned by the
media upload service (`store/mediaUploads.ts`), keyed by media ID, never in
`ThreadState`. Only a completed compression that passed output validation is
kept (URI, MIME type, size, passthrough reason, web `bytes`). A retry after an
upload failure leases it and uploads without copying, probing, or compressing.
Native output is first checked with the injected `getFileSize`; if the file is
gone or its size changed, the entry is dropped and the attempt compresses once.
The entry is retired when the item or its post is removed, the store is
destroyed, a non-retryable failure occurs, or the processed video blob
supersedes it. Cleanup waits for attempts still reading the output, so removal
never deletes a file a non-abortable step is using.

#### Resource ownership

Each V2-visible resource has one owner and a last reader. Cleanup is
deterministic and tested through injected release dependencies.

| Resource                                               | Owner                            | Released                                                                                         |
| ------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Source URI/`File`, `original`, `supersededUri`, drafts | The caller or draft storage      | Never by V2                                                                                      |
| Web metadata probe URL                                 | The production metadata adapter  | Right after the scalars are extracted (`releaseVideoProbeUri`)                                   |
| Image compression output                               | The image worker                 | Once, after the upload (or a cancelled/failed attempt) settles                                   |
| Native encoded video output (file)                     | The worker, then retained entry  | By the worker if never retained; otherwise with the entry after its last reader                  |
| Android readable copy                                  | The attempt, then retained entry | With the attempt, or with the entry when the result aliases it                                   |
| Video telemetry and `videoUploadIds`                   | The upload service               | `videoUploadIds` on removal/teardown; telemetry (`publishableVideos`) outlives removal for plans |

- The shared web `getVideoMetadata` returns a new object URL per probe.
  `createScalarVideoMetadata` (wired in `store/uploadDependencies.ts`) returns
  only scalars and revokes that URL; native returns the source URI, which is
  never released.
- `compressImage` always writes a new file (native) or object URL (web). The
  worker calls the required `releaseCompressedImage({uri})` dependency once,
  after its last reader settles, including for a late result of a cancelled
  attempt. Native deletes the file with `safeDeleteAsync`; web revokes the URL.
- Only a video result with no `passthroughReason` and no `bytes` is a new file.
  Pass-through, GIF, and web output alias the source, the Android copy, or
  memory, and are never deleted (`releaseCompressedVideo` is a no-op on web).
- The worker passes `createVideoTelemetry` a scalar asset, never the source
  `File`/`Blob`, since the telemetry object is retained.
- Cleanup errors, sync or async, are swallowed and never change an upload's
  outcome.

### Adapter fidelity

Both adapters return `ThreadStoreInitialState`. Neither constructs a store,
dispatches corrective edit actions, loads/saves/deletes draft files, resolves
remote views, reads media, or starts uploads; the upload workers prepare every
source. Runtime IDs, task state, revisions, moderation objects,
and shell callbacks do not belong in normalized content. Web picker `Blob` input
is a runtime source convenience, not a persisted draft representation.

`composerOptsToInitialState({composerOpts, ...options})`:

- Preserves initial text, Unicode, and whitespace; nonempty explicit text takes
  precedence over mention-generated text.
- Detects at most one record and one media URL from initial facets. Explicit
  quote/local media wins over detected candidates; explicit image plus video is
  rejected. A quote can coexist with images, video, or an external card.
- Preserves a supplied quote strong ref/view without refetching. Image order,
  dimensions, and alt text survive. An intent video keeps its URI and
  dimensions; the worker resolves MIME type and duration.
- Leaves `openGallery`, `onPost`, `onPostSuccess`, logging context, close
  behavior, and auth/block checks with the shell caller.
- Retains a moderation-free reply parent preview (URI/CID, text, languages,
  author, optional embed). It does not fabricate a thread root or infer a reply
  from an embedded quote. New-composition gate defaults come from the caller's
  `postInteractionSettings`.

`draftToInitialState({draftId, draft, loadedMedia, ...options})`:

- Preserves post order, text, and self-labels, applies top-level `draft.langs`
  to each post, and starts with the draft ID and `isDirty: false`.
- Uses saved gate fields rather than account defaults. Absent fields mean
  protocol defaults; unknown typed gate rules stay intact.
- Reads legacy `embedImages` before `embedGallery` items, without deduplicating
  refs or copying source files, and looks up `localRef.path` in the caller's
  media map. The combined ten-image limit applies.
- Restores video source, local ref, alt text, and caption content, taking the
  MIME type from the MIME-in-local-ref convention.
- Recognizes Tenor/Klipy GIF URL conventions, including dimensions and custom
  alt text, without turning arbitrary `.gif` URLs into provider GIFs. Other
  external URLs become record/media candidates by recognized URL kind.
- Classifies strong refs by AT-URI collection (post/feed/list/starter pack);
  known refs are not fetched again.
- Throws `ComposerAdapterError` for missing loaded media, overflow, conflicting
  slots, unsupported records/gallery entries/labels, or other lossy conversion,
  so a rich draft never silently becomes a text-only restoration. Unreadable
  media is not an adapter error: the item is restored and its upload fails
  retryably in the worker, keeping its local ref.

Supplied resolved attachment views are trusted for the session. Resolve missing
data only; do not force-refresh before publication. If a reference becomes
invalid, surface the operation's failure rather than silently changing content.

### Planner and writer invariants

- The planner captures published snapshot references before awaiting and never
  consults live state later. Pending or failed work returns structured errors.
  Caller tokens suppress stale plan results; the tester marks a result stale by
  snapshot identity.
- All-empty compositions are rejected. Trailing empty posts are dropped;
  skipping non-trailing empty posts requires `skipEmptyPostsConfirmed`.
  Tags-only and attachment-only posts are not empty. `requireAltText` is caller
  policy (normally from preferences), not a lexicon constraint.
- Text goes through the shared rich-text preparation (authoritative mention
  facets, invalid-mention stripping, newline cleanup, shortened URLs, final
  grapheme validation). Explicit tags are kept separately and validated against
  their generated-lexicon limits.
- Record keys come from `TID.next`; `__createRkey` is a test-only seam. Keys must
  be valid TIDs, unique within a plan. CIDs and final AT URIs are computed so each
  post replies to its predecessor while retaining the original root. External
  reply roots and parent refs come from AppView, not the preview.
- Embeds: images for 1-4, gallery for 5-10, video with caption blobs,
  external/GIF/chat-invite cards, records, or record-with-media. Custom GIF alt
  text is preserved. Card/GIF thumbnail uploads are allowed during planning;
  post and gate writes are not.
- A threadgate is emitted for the first planned post when allow rules are
  defined, including `[]`, and not when everyone may reply. A postgate is emitted
  for every planned post when shared embedding rules are nonempty. Gates reuse
  their post's rkey in a different collection and its final URI and time.
- Each generated record and the whole `applyWrites` input are validated. The
  plan returns full planned records and refs, and nothing automatically logs
  record contents, local paths, captions, credentials, views, or raw exceptions.
  The redacted structural summary is a DebugComposer helper
  ([`summarizeComposerV2Plan.ts`](../../view/screens/DebugComposer/summarizeComposerV2Plan.ts)),
  not part of the planner.
- The writer requires a successful plan, a matching authenticated DID/repo, and
  `validate: true`. It sends one unchanged request and returns ordered URIs. SDK
  failures are preserved exactly. Any rejection after dispatch, including a
  transport abort, requires reconciliation; there is no automatic retry.
- Publishing is always an explicit caller operation, never a side effect of
  editing, planning, or saving a draft.
- Planner no-write tests run at the real dependency boundary, not against a mock
  of the whole planner. Writer tests assert the exact request and no second call
  on failure.

### Error reporting and React integration traps

`ComposerV2OnError(event, cause?)` is optional and synchronous. Structural events
carry a source, stable code, kind (`validation`, `operational`, `unexpected`),
local post/media IDs where applicable, and recovery (`retry`, `edit`,
`reconcile`, `none`). The untrusted diagnostic cause is a separate argument.

- Register the policy before initialization and eager work. Adapters can receive
  the policy before a store exists; later operations use `store.reportError`.
  Report at one owning boundary, not again when catching its rejection.
- Report accepted failures once per attempt, not on renders, progress, or reads
  of an already failed snapshot. A newly failed retry is a new report. Ignore
  cancelled, stale, and destroyed work, except dispatched write failures whose
  outcome may be uncertain. Supersedable callers guard their attempt/session
  tokens.
- Callback exceptions cannot replace operation outcomes, interrupt cleanup, or
  recursively produce reporting failures. State, results, and rejections remain
  the authority; this is not a replacement error channel.
- Ordinary planner preflight and record-validation errors remain local results.
  Unexpected planner causes are retained non-enumerably, outside serialized
  results. URI state holds a safe fallback/code rather than raw exception
  messages, and UI translates stable codes. Do not forward every validation
  result to crash reporting or a global toast.
- Reset, account replacement, and unmount retire old stores and invalidate async
  scenario/plan work. Deferred scenario stores must be destroyed, not orphaned.
- Native dialogs can portal into a separate root outside the screen provider.
  Store-reading dialog content must re-provide its owning `ThreadStore` inside
  `Dialog.Outer` (`src/view/screens/DebugComposer/__tests__/dialogPortalContext.test.tsx`
  covers this). The shared gate
  dialog stays mounted so its control is attached before the first open.
- Keep Lingui macros at compilable call sites. Passing a tagged-template macro
  binding into an ordinary helper breaks the text; use the tested message hooks.
- Synthetic draft fixtures must not contain network-bearing GIF/card URLs that
  real workers could fetch. Use local test doubles for those cases.

### Deferred draft design

Not implemented. Inbound conversion exists: `draftToInitialState()` turns
already-loaded draft data into initial state and the upload workers prepare
restored media. Draft storage loading and production draft UI are not wired.
Re-audit the draft schema before implementing outbound persistence.

- **Codec:** a UI-free V2 serializer returning draft data and a local-media
  manifest, reusing the authenticated draft endpoints and native/web storage. Do
  not convert to legacy `ComposerState` just to call its save hook. Restore only
  through `draftToInitialState()` and the constructor. Write `embedGallery` for
  images while reading both draft image shapes.
- **Schema gaps:** the draft schema lacks explicit tags and reply targets and has
  only thread-wide languages; external previews persist as URLs. Prefer proper
  schema/API support, never hand-edited generated lexicons or invented wire
  fields. Until then, return a specific representability error instead of
  discarding content or flattening languages. A local sidecar needs an explicit
  decision, since it gives the same remote draft different meaning per device.
- **Media:** saving must not require successful uploads if a usable local source
  exists. Persist editable bytes, not upload status/functions, multipart
  sessions, temporary URLs, or plans/keys. Do not overwrite a ref still needed
  by an older draft or another owner. A transient `File`/blob URL in state is
  not proof of persistence. Report missing or other-device media instead of
  silently dropping it.
- **Save sequencing:** capture an immutable snapshot and content revision;
  check representability; stage new media non-destructively; save remotely;
  adopt the draft ID and saved revision only after both succeed; then clean up
  only refs proven unneeded. The legacy hook saves remotely before copying local
  media; do not inherit that ordering. Failed or ambiguous saves must retain
  media required by either the old or possibly updated draft, and never repeat
  an uncertain create.
- **Concurrent edits:** serialize saves per session. A successful save adopts
  its draft ID but must not clear newer edits, so compare a content revision,
  not snapshot identity (upload progress also changes snapshots). Retired
  sessions and account changes must not apply acknowledgements to a replacement
  store.
- **Scope:** simple tester Save/Open controls; production UI and explicit
  publication behavior unchanged.

## Verification

```sh
pnpm test src/components/ComposerV2 src/view/screens/DebugComposer --watchman=false --runInBand
pnpm typecheck
pnpm lint
pnpm prettier
```

Shared video changes also need
`pnpm test src/lib/media/video --watchman=false --runInBand`.
