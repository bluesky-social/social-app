# Composer V2 implementation plan

## Goal

Replace the current post composer with a store-first implementation that can represent, hydrate, edit, validate, and eventually publish every composer flow supported by the app.

The first submission milestone will stop before writing records to the repository: it will build the complete write set, validate every record locally, and log a safe/debuggable representation of the result. Actual `applyWrites` execution can be enabled after the record-building path is proven.

## Current baseline

`src/components/ComposerV2/store/` currently provides:

- A provider-owned external store with `getState()`, `subscribe()`, actions, and `destroy()`.
- Ordered multi-post thread state.
- Per-post text, languages, labels, media, a non-quote embed, and a quote embed.
- A unified media model for images, one video, or one GIF.
- Simulated image/video upload progress, cancellation, failure, and retry.
- Async URI resolution with pending, resolved, and failed states.
- Per-post revision counters that prevent stale link-resolution results from overwriting newer state.
- `useSyncExternalStore` hooks for whole-thread and per-post subscriptions.
- Derived rich text and shortened grapheme length through `useThreadPostRichText()`.
- A debug route at `/sys/debug-composer` for exercising the store.

This is not yet connected to the production composer shell, draft system, real media processing, or publishing pipeline.

## Required work

### 1. Complete the composer state model

The store needs enough state to describe the whole composition session, not only individual posts.

Add or formalize:

- Reply target, including the parent/root data needed to build reply refs.
- Thread-wide postgate settings that apply consistently to every post in the composed thread.
- Threadgate settings.
- Draft identity and dirty/saved state.
- Submission state and validation errors.
- A `movePost`/reorder action that preserves each post’s identity, content, and in-flight task ownership while changing thread order.
- Session-level metadata needed by composer intents, while keeping callbacks and other non-serializable shell concerns outside persisted state.
- A documented distinction between:
  - serializable composer data;
  - runtime-only task handles, retry callbacks, and abort controllers;
  - UI-only state such as focus, open dialogs, and active post.

Invariants should remain enforced at the store action boundary rather than relying on the UI to produce valid state.

#### Record and media attachment slots

Replace the current `quote` / `embed` / media split with two protocol-aligned active attachment slots:

```ts
type PostAttachments = {
  record?: RecordAttachment
  media?: MediaAttachment
}
```

`RecordAttachment` represents one strong-ref-backed record, including a quoted post, feed, list, or starter pack. A quote is therefore a post-kind record attachment, not a separate structural slot.

`MediaAttachment` represents one images/gallery, video, or external embed. GIFs and chat invites resolve to external embeds and therefore occupy the media slot. An images/gallery attachment may contain multiple image items but is still one media attachment.

The valid active combinations are:

- No attachment.
- One record.
- One media attachment.
- One record plus one media attachment, serialized as `app.bsky.embed.recordWithMedia`.

The store must prevent two active records or two active media attachments. It should never depend on submit-time priority to silently discard an impossible combination.

If we preserve the current behavior where an automatically suggested external card reappears after user-selected media is removed, keep that candidate outside the active attachment slots, for example as `suggestedExternal`. It is UI suggestion state and is not part of the embed that will be submitted until promoted into the media slot.

### 2. Postgates and threadgates

Represent both interaction-control record types in the V2 store and expose actions for editing them. Postgate configuration is thread-wide in the composer: one setting is edited once and applied consistently to every post record in the thread.

Requirements:

- Hydrate defaults from `app.bsky.actor.defs.PostInteractionSettingsPref` when opening a new composer.
- Restore gate settings from a saved draft.
- Preserve the distinction between “everybody may reply,” explicit allow rules, and “nobody may reply.”
- Support mention, follower, following, and list threadgate rules.
- Support postgate embedding rules and detached embedding URIs where applicable.
- Keep one thread-wide postgate configuration rather than independently editable per-post settings.
- Mark gate edits dirty and include them in draft serialization.
- During submit planning:
  - create the threadgate only for the root post and only when required;
  - when the shared postgate configuration requires a record, create a matching postgate for every post in the thread;
  - use the same record key as the associated post;
  - populate the final post URI and creation time before validation.

Reuse the existing conversion utilities in `src/state/queries/threadgate/` and `src/state/queries/postgate/` where they still express the desired behavior.

### 3. Unified initial-state hydration

Define one normalized input interface, provisionally `ThreadStoreInitialState`, that is the only initial-data shape consumed by `createThreadStore()`. Both open-composer intents and saved drafts must transform into this same interface before the store is created:

```text
ComposerOpts -----------------> composerOptsToInitialState() --+
                                                             |
Saved draft + loaded media ---> draftToInitialState() --------+--> ThreadStoreInitialState --> createThreadStore()
```

Keep the existing shell-facing `ComposerOpts` contract during migration, but isolate it behind the compatibility adapter. The draft adapter performs its source-specific decoding and media lookup, then produces the same normalized input. The internal V2 shape can improve independently without forcing open-composer callers or the draft schema to mirror the store directly.

`ThreadStoreInitialState` should be plain data. It should describe posts, reply context, gates, draft identity, and local media sources without containing generated runtime task handles, retry closures, revision counters, or UI callbacks. The store constructor owns the one-time transformation from this normalized input into live `ThreadState`, including IDs, derived fields, runtime task setup, and eager media work.

Support at minimum:

- Empty posts.
- Initial text.
- Initial mention text and facets.
- Initial quote, preferably using an already-hydrated post view when supplied.
- Initial photos, including dimensions and alt text.
- Initial video, including dimensions and any known MIME type.
- Reply targets.
- `openGallery` intent.
- Default postgate/threadgate preferences.
- Intent combinations that are valid, such as text plus quote or text plus photos.
- Link detection in initial text using the same quote-versus-external rules as text entered after opening.

The hydration API should make ownership clear:

- Data that belongs in records enters the normalized initial-state interface and then the store.
- Source-specific parsing stays in the `ComposerOpts` and draft adapters rather than branching inside store actions.
- `onPost`, `onPostSuccess`, logging context, and composer-close behavior remain session/shell concerns.
- Hydration should produce a fully usable first snapshot without requiring mount-time corrective actions.
- Hydrated state starts clean unless the source is explicitly an unsaved user mutation.
- Equivalent intent and draft content should normalize to semantically equivalent `ThreadStoreInitialState` values.

Add table-driven tests covering every supported intent and meaningful combination, plus contract tests that feed normalized initial state directly into the store independently of its source adapter.

### 4. Draft hydration and serialization

Add a bidirectional adapter between V2 state and `app.bsky.draft.defs.Draft`.

#### Serialization

- Serialize every post in thread order.
- Preserve text, labels, languages if supported by the draft schema, quotes, external embeds, GIFs, images/gallery items, video, captions, postgate settings, and threadgate settings.
- Reuse existing `localRefPath` values when re-saving loaded media.
- Allocate local refs for newly added media and return the source-path map needed by draft storage.
- Track original local refs so removed media can be cleaned up without deleting media still referenced by the edited draft.
- Do not serialize runtime functions, upload task handles, temporary revision counters, or abort controllers.
- Mark the store saved only after both draft data and associated local media have been persisted successfully.

#### Hydration

- Transform the draft and loaded local media into the same `ThreadStoreInitialState` interface used by the `ComposerOpts` adapter; do not maintain a separate draft-only store initialization path.
- Restore the entire thread and its ordering.
- Restore text and recompute facets/grapheme counts.
- Restore labels and gate settings.
- Restore quotes and external/GIF embeds.
- Read both legacy `embedImages` and current `embedGallery` draft shapes.
- Restore image and video source paths from local refs without unnecessary copies.
- Restore video alt text, MIME type, captions, and dimensions when available.
- Reattach runtime retry behavior and create fresh task/revision state rather than trusting serialized runtime state.
- Start media processing and upload eagerly after restoration, using the durable local media as the source. Reuse a valid completed upload from the same live session when possible, but never replace a local draft with an unusable remote-only reference.
- Preserve `draftId`, initialize `isDirty` to false, and make subsequent user edits dirty.

Draft round-trip tests should assert semantic equality rather than object identity and should include legacy image drafts, galleries, videos with captions, GIFs, quotes, gates, and multi-post threads.

### 5. Support `app.bsky.embed.gallery`

The V2 media model currently enforces the legacy four-image ceiling. Update it for the gallery embed.

Requirements:

- Allow up to 10 images in the authoring UI. The lexicon’s larger schema ceiling is not the current product limit.
- Keep image ordering stable through selection, editing, draft save/restore, upload, and record construction.
- Preserve per-image alt text and aspect ratio.
- Recompute selection capacity from the 10-image product limit.
- Continue to allow only one active media attachment: an images/gallery attachment excludes video, GIF/external, and any other media attachment.
- Retain the compatibility split: emit `app.bsky.embed.images` for up to four images and `app.bsky.embed.gallery` for five to 10 images.
- Draft serialization should write `embedGallery`; hydration must continue reading both `embedImages` and `embedGallery` for backwards compatibility.
- Ensure the preview components can render and edit all selected images, not only the first four.

### 6. Real image processing and uploads

Replace the image upload simulation with the existing production primitives. Compression and upload begin eagerly when an image enters the store, including through intent or draft hydration.

Pipeline:

1. Retain the original local source and dimensions.
2. Compress/resize with the post image configuration.
3. Update the media item with the transformed path, MIME type, dimensions, and aspect ratio.
4. Upload through the current PDS lex client.
5. Store the returned blob reference on the exact media item.
6. Surface progress when the underlying primitive can provide it.
7. Support cancellation on media removal, post removal, composer destruction, or replacement.
8. Classify failures and attach a retry action that restarts from the correct stage.

The implementation should reuse `compressImage`, `IMAGE_SIZE_CONFIG_POSTS`, and the existing blob-upload helper rather than creating a second compression policy.

Uploads must be race-safe: a completion from a removed/replaced image cannot write into the current post.

### 7. Real video processing and multipart upload

Replace the video upload simulation with the existing compression and multipart pipeline. Compression and upload begin eagerly when a video enters the store, including through intent or draft hydration.

Requirements:

- Validate duration, MIME type, dimensions, and account upload limits before or during processing as appropriate.
- Compress/transcode using the existing video machinery and expose compression state separately from network-upload state.
- Use `uploadVideo()` / `uploadVideoMultipart()` from `src/lib/media/video/`.
- Provide the PDS client and account dispatch URL required for service-auth token creation.
- Forward multipart byte progress into the media item’s upload status.
- Preserve cancellation through compression, part upload, finish polling, and status polling.
- Preserve existing multipart recovery behavior for missing parts, token refresh, retryable failures, and abort cleanup.
- Store the completed video blob/job result needed by `app.bsky.embed.video`.
- Upload captions through the PDS, retain language metadata, and include caption blob refs in the final embed.
- Expose retryable versus terminal failures without allowing stale jobs to update replaced media.
- Keep draft serialization based on durable local compressed media and caption content, not ephemeral multipart session state.

### 8. Grapheme counting and post validity

A derived shortened grapheme count already exists in `useThreadPostRichText()`. Promote it into the validation/UI contract rather than creating a second counter.

Requirements:

- Count graphemes after URL shortening, matching actual submitted rich text.
- Show the standard counter behavior as a post approaches and exceeds the limit.
- Validate every post independently in a thread.
- Recompute only when text changes.
- Keep facet detection and final rich-text normalization aligned with the existing composer’s `shortenLinks`, invalid-mention stripping, newline cleanup, and resolved-facet behavior.
- Cover Unicode, emoji, combining marks, long URLs, and multi-post threads in tests.

### 9. Submit planning, record construction, logging, and validation

For the first milestone, submission must not call `com.atproto.repo.applyWrites`. Media processing and uploads are real and eager; only the final repository write remains disabled.

Build a submission planner that performs the same deterministic work needed by the eventual network mutation:

1. Freeze or snapshot the thread being submitted.
2. Validate composer-level and per-post preconditions.
3. Ensure required media processing/uploads have completed successfully.
4. Resolve rich-text facets using the appview client.
5. Trim and normalize text exactly as production submission will.
6. Build each `app.bsky.feed.post` record in thread order.
7. Allocate deterministic TIDs/rkeys and final AT URIs.
8. Compute each post CID so later posts can reference the preceding post.
9. Build reply refs:
   - preserve an external reply root for replies;
   - otherwise use the first post as the thread root;
   - use the immediately previous post as each subsequent parent.
10. Build the active record and media attachments from resolved state and uploaded blobs, emitting a record, media, or `recordWithMedia` embed as appropriate.
11. Build required threadgate and postgate records with matching rkeys.
12. Produce the complete `com.atproto.repo.applyWrites` create list.
13. Validate each record using the generated lexicon validators and validate the complete write input shape.
14. Log a redacted structured representation of the planned writes and validation result.
15. Return structured success/errors to the debug UI without performing a repository write.

The planner should be separated from the future side effect so enabling real submission later is a narrow change: pass the already-validated writes to the PDS client with `validate: true`.

Do not log local file paths, caption contents, auth data, or other sensitive/transient values. Blob refs, record types, rkeys, URIs, counts, and validation errors are sufficient for debugging.

### 10. Debug UI and integration harness

Expand `/sys/debug-composer` as implementation lands:

- Open with representative composer intents.
- Add/remove/reorder thread posts. Reordering should be supported by the store and debug harness, but does not need to ship in the initial production UI.
- Exercise photos, gallery limits, video, GIF, quotes, and external embeds.
- Edit postgate/threadgate settings.
- Save and restore a draft.
- Display per-stage media progress and retry actions.
- Display grapheme counts and validation failures.
- Run submit planning and show the redacted validated write set.

The debug route should remain a harness. Production UI migration should begin only after the store, adapters, and submission planner have stable contracts.

## Cross-cutting requirements

### Store and async safety

- Every async operation must be invalidated when its target is removed or replaced.
- `destroy()` must cancel uploads, compression, resolution, and submit planning.
- No async progress update should mark a draft dirty.
- User-visible mutations should preserve no-op reference equality where practical.
- Previous snapshots must not be mutated after publication to subscribers.

### Error model

Use stable error codes plus safe display text for:

- Link resolution.
- Image compression/upload.
- Video validation/compression/multipart upload.
- Caption upload.
- Draft media restoration.
- Record construction and lexicon validation.

Retry actions should exist only when retrying can plausibly succeed without user intervention.

### Testing

Maintain focused tests for:

- Store invariants and subscription behavior.
- Every open-composer hydration intent.
- Draft round trips and backwards compatibility.
- Gallery limits and ordering.
- Upload cancellation, retries, and stale completion suppression.
- Multipart video integration boundaries.
- Grapheme and rich-text validity.
- Multi-post ordering, reordering, and CID/reply chaining.
- Gate record construction.
- Lexicon validation of every planned record.
- Confirmation that the initial submit milestone never calls `applyWrites`.

## Proposed implementation sequence

The sequence is intended to keep each step testable and avoid building UI against unstable state shapes:

1. Finish lex-client adaptation and remove obsolete client/agent assumptions.
2. Finalize the serializable composer state and runtime-task boundary.
3. Add initial-intent hydration and postgate/threadgate state.
4. Add gallery semantics and update media invariants.
5. Add draft serialization/hydration against the finalized state shape.
6. Replace image simulation with real compression/upload.
7. Replace video simulation with real compression/multipart upload and caption uploads.
8. Centralize grapheme/rich-text validation.
9. Build the no-write submit planner, lexicon validation, and safe logging.
10. Expand the debug harness, then begin production UI migration.

## Decisions made

- Image and video processing/upload begin eagerly when media enters the store, including through intent and draft hydration.
- Postgate configuration is thread-wide in the composer and applies consistently to the posts in that thread.
- The no-write submit milestone performs real media uploads. It suppresses only the final `applyWrites` repository mutation.
- Preserve embed compatibility: use `app.bsky.embed.images` for one to four images and `app.bsky.embed.gallery` for five to 10 images.
- Keep `ComposerOpts` as the shell-facing compatibility API while mapping both it and saved drafts into one normalized `ThreadStoreInitialState` consumed by the store.
- Support post reordering in the store, record planner, tests, and debug harness, but defer production reordering UI.
- Model publishable attachments as one record slot plus one media slot. Quotes are post-kind record attachments; images/gallery, video, and external cards are media attachments. Derive `recordWithMedia` only during record construction, and never permit two active records or two active media attachments.
- Trust hydrated attachment data for the lifetime of the composer session: display supplied views immediately and resolve only missing data. Do not forcibly refresh a supplied record/external view before submission; surface a submission error if the referenced record has become invalid.

## First milestone completion criteria

The first coherent V2 milestone is complete when:

- Every existing open-composer intent hydrates into V2 state.
- Drafts round-trip all supported content and gate settings.
- Up to 10 images can produce a gallery embed.
- Images and videos use real, cancellable upload paths, including multipart video.
- Every post exposes correct shortened grapheme validity.
- Submit builds the complete thread/gate write set, validates it locally, logs it safely, and performs no repository write.
- ComposerV2 tests, project typechecks, lint, formatting checks, and relevant media tests pass.
