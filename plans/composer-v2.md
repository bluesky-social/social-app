# Composer V2 implementation reference

## Goal

Develop and verify the store-first composer through `/sys/debug-composer`, covering initialization, editing, media, gates, record construction, and eventually draft round trips. Production composer UI migration is out of the current plan.

The first submission milestone stops before writing records to the repository: build the complete write set, validate every record locally, and expose a safe/debuggable result. Actual `applyWrites` execution requires a separate decision.

`AGENTS/tasks/` is the only active execution queue; `AGENTS/tasks/README.md` records the operator-approved order. This document specifies behavior; its section numbers are topics, not task IDs. Completed legacy milestones are archived in `plans/composer-v2-history.md`.

## Current baseline

`src/components/ComposerV2/store/` currently provides:

- A provider-owned external store with `getState()`, `subscribe()`, actions, and `destroy()`.
- Ordered multi-post thread state.
- Per-post text, languages, labels, and one record attachment plus one media attachment.
- Quotes, feeds, lists, and starter packs share the record slot; images, video, GIFs, external cards, and chat invites share the media slot.
- Eager real image/video processing, PDS uploads, multipart video processing, caption uploads, cancellation, failure classification, and retry.
- Async URI resolution with pending, resolved, and failed states.
- Per-post revision counters that prevent stale link-resolution results from overwriting newer state.
- `useSyncExternalStore` hooks for whole-thread and per-post subscriptions.
- Derived rich text and shortened grapheme length through `useThreadPostRichText()`.
- A debug route at `/sys/debug-composer` for exercising the store.

Real media workers are implemented and wired into the tester. Full draft persistence and no-write record construction are still pending; production shell migration and publishing are outside the current scope.

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

Implemented in legacy milestone #1 (see `plans/composer-v2-history.md`): the `quote` / `embed` / media split is replaced by two protocol-aligned active attachment slots:

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

Store configuration, inbound hydration, and editing actions are implemented. Postgate configuration is thread-wide: one setting is edited once and applied consistently to every post record in the thread. Task 0006 builds the actual records; task 0008 adds draft serialization. The following describes the end-to-end behavior.

Requirements:

- Hydrate defaults from `app.bsky.actor.defs.PostInteractionSettingsPref` when opening a new composer.
- Restore gate settings from a saved draft.
- Preserve the distinction between “everybody may reply,” explicit allow rules, and “nobody may reply.”
- Support mention, follower, following, and list threadgate rules.
- Support postgate embedding rules for newly composed posts.
- Keep one thread-wide postgate configuration rather than independently editable per-post settings.
- Mark gate edits dirty and include them in draft serialization.
- During submit planning:
  - create the threadgate only for the root post and only when required;
  - when the shared postgate configuration requires a record, create a matching postgate for every post in the thread;
  - use the same record key as the associated post;
  - populate the final post URI and creation time before validation.

Reuse the existing conversion utilities in `src/state/queries/threadgate/` and `src/state/queries/postgate/` where they still express the desired behavior.

### 3. Unified initial-state hydration

Implemented in legacy milestones #2 and #3: `createThreadStore({resolvers, initialState})` accepts one normalized `ThreadStoreInitialState` interface, and the adapters in `src/components/ComposerV2/adapters/` transform open-composer intents and saved drafts into it:

```text
ComposerOpts -----------------> composerOptsToInitialState() --+
                                                             |
Saved draft + loaded media ---> draftToInitialState() --------+--> ThreadStoreInitialState --> createThreadStore()
```

Keep the existing shell-facing `ComposerOpts` contract during migration, but isolate it behind the compatibility adapter. The draft adapter performs its source-specific decoding and media lookup, then produces the same normalized input. The internal V2 shape can improve independently without forcing open-composer callers or the draft schema to mirror the store directly.

`ThreadStoreInitialState` is plain data. It describes ordered posts,
text/languages/labels, record/media attachments, a minimal serializable reply
target, draft identity/dirty state, and local media sources (including local
refs, alt text, and captions). It contains no generated item IDs, upload
statuses, runtime task handles, retry closures, revision counters, moderation
objects, or UI callbacks. The store constructor builds the full initial
snapshot before starting eager real media workers or resolving URI candidates.
Progress and retries do not dirty the initial composition. Oversized normalized
image sets are rejected before starting work rather than silently losing media.

Support at minimum:

- Empty posts.
- Initial text.
- Initial mention text and facets.
- Initial quote, preferably using an already-hydrated post view when supplied.
- Initial photos, including dimensions and alt text.
- Initial video, including dimensions and any known MIME type.
- Reply targets.
- Link detection in initial text using the same record-versus-media routing
  rules as text entered after opening.
- Draft-level languages, labels, local refs, captions, GIFs, and record
  collection classification.

`openGallery`, callbacks, logging context, and auth/block checks remain outside
this data contract. Video MIME probing and draft image/video metadata probes are
injectable at the adapter boundary. Unsupported or lossy input throws a local
`ComposerAdapterError` rather than being silently dropped.

The hydration API should make ownership clear:

- Data that belongs in records enters the normalized initial-state interface and then the store.
- Source-specific parsing stays in the `ComposerOpts` and draft adapters rather than branching inside store actions.
- `onPost`, `onPostSuccess`, logging context, and composer-close behavior remain session/shell concerns.
- Hydration should produce a fully usable first snapshot without requiring mount-time corrective actions.
- Hydrated state starts clean unless the source is explicitly an unsaved user mutation.
- Equivalent intent and draft content should normalize to semantically equivalent `ThreadStoreInitialState` values.

Focused adapter tests cover link classification, explicit precedence, reply
sanitization, draft media ordering/metadata/captions/GIFs, conversion errors,
and adapter-to-store initialization. Contract tests continue to feed normalized
initial state directly into the store independently of its source adapter.

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

The V2 media model now accepts up to 10 images. Serialization still needs to choose between the legacy images embed and gallery based on item count.

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

Implemented in legacy milestone #7 with the existing production primitives. Compression and upload begin eagerly when an image enters the store, including through intent or draft hydration.

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

Uploads must be race-safe: a completion from a removed/replaced image cannot write into the current post. Image compression is logically cancellable because the existing compressor has no abort signal; a cancelled result is discarded and cannot start the PDS upload.

The store receives an explicit media dependency bundle containing the PDS lex client, localization, and the account dispatch URL used for video service auth. Missing dependencies fail the item instead of producing a placeholder blob. Prepared image outputs and transformed metadata are retained separately from the original source fields.

### 7. Real video processing and multipart upload

Implemented in legacy milestone #7 with the existing compression and multipart pipeline. Compression and upload begin eagerly when a video enters the store, including through intent or draft hydration.

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

Todo #7 uses `uploadVideo()` only as the production wrapper around `uploadVideoMultipart()`; it does not use the legacy component reducer/process branch. The worker handles immediate completed jobs and bounded status polling, preserves completed video blobs when a caption upload fails, and stores caption blob refs separately from editable `{lang, content}` values. Compression, multipart byte transfer, server processing, and caption upload are distinct observable phases.

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
6. Build each `app.bsky.feed.post` record in thread order, including explicit `tags` from per-post state, separate from hashtag facets. Validate tag limits against the current lexicon; document draft-schema gaps rather than silently claiming tag persistence.
7. Allocate deterministic TIDs/rkeys and final AT URIs.
8. Compute each post CID so later posts can reference the preceding post.
9. Build reply refs:
   - preserve an external reply root for replies;
   - otherwise use the first post as the thread root;
   - use the immediately previous post as each subsequent parent.
10. Build the active record and media attachments from resolved state and uploaded blobs, emitting a record, media, or `recordWithMedia` embed as appropriate. Select `embed.images` for 1-4 images and `embed.gallery` for 5-10 here, in complete record-set construction rather than a separate serialization task.
11. Build required threadgate and postgate records with matching rkeys.
12. Produce the complete `com.atproto.repo.applyWrites` create list.
13. Validate each record using the generated lexicon validators and validate the complete write input shape.
14. Log a redacted structured representation of the planned writes and validation result.
15. Return structured success/errors to the debug UI without performing a repository write.

The planner is implemented in `src/components/ComposerV2/planner.ts` as `planComposerV2({snapshot, dependencies})`. It accepts one copied composition snapshot, a DID, deterministic clock/key seams, and explicit read/upload helpers. It returns either the validated `applyWrites` input and planned post refs or stable structured errors. It never calls a repository mutation. The snapshot is copied before the first await: upload completions after capture are not mixed into the attempt, and edits during reply/facet preparation cannot change it; callers retry planning with a new snapshot after work finishes.

The planner should be separated from the future side effect so enabling real submission later is a narrow change: pass the already-validated writes to the PDS client with `validate: true`.

Do not log local file paths, caption contents, auth data, or other sensitive/transient values. Blob refs, record types, rkeys, URIs, counts, and validation errors are sufficient for debugging. The debug harness uses `summarizeComposerV2Plan()` and exposes only structural counts, refs, embed kinds, and stable error codes; its state dump likewise omits post text, captions, paths, blobs, views, and exception payloads.

### 10. Debug UI and integration harness

Expand `/sys/debug-composer` as implementation lands:

- Open with representative composer intents.
- Add/remove/reorder thread posts through the store and tester controls. Production UI is outside this plan.
- Exercise photos, gallery limits, video, GIF, quotes, and external embeds.
- Edit postgate/threadgate settings.
- Save and restore a draft.
- Display per-stage media progress and retry actions.
- Display grapheme counts and validation failures.
- Run submit planning and show the redacted validated write set.

The debug route is the tester UI for this plan, not a prototype production composer. Task 0007 completes controls and a verification checklist for all implemented capabilities, including gate editing, per-item/bulk retry, reordering, explicit tags, and no-write plan inspection. Task 0008 adds actual draft save/restore controls last. Production UI migration is not scheduled.

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

## Execution queue

The authoritative task definitions/statuses live in `AGENTS/tasks/`; existing task numbers are stable. Follow `AGENTS/tasks/README.md`, not numeric order or old milestone numbers:

1. **0001:** Name creation-action result fields (`addedMediaIds`, `addedPostId`) and avoid reporting phantom additions.
2. **0002:** Retry all eligible failed uploads without restarting active work.
3. **0003:** Simplify URI-resolution helpers while preserving destination ownership and retry semantics.
4. **0005:** Add reordering and minimal tester controls.
5. **0006:** Build and validate the complete no-write record set, including gallery selection, explicit tags, replies, and gates; expose a minimal tester action.
6. **0007:** Complete the tester UI so every implemented capability can be exercised. The task retains its original `production-ui` filename, but production UI is explicitly dropped from its scope.
7. **0004:** Extract image compression behind a UI-free static import, moved here by operator direction immediately before drafts.
8. **0008:** Add draft serialization, persistence, safe cleanup, round trips, and tester save/restore controls last.

Use the tester as capabilities land, then close coverage gaps in 0007; do not wait for a production UI. The originally requested explicit-tag typeahead remains a future production design intention, not a requirement to invent a suggestions service for the tester. A simple explicit-tags editor is sufficient for testing.

Initial hydration, gate state, the 10-image cap, store-boundary copying, and real media workers are already implemented. Their milestone history and the old-to-new task mapping are in `plans/composer-v2-history.md`.

## Development checks

Use repository scripts, never the underlying quality tools directly:

```sh
pnpm test src/components/ComposerV2 --watchman=false --runInBand
pnpm typecheck
pnpm lint
git diff --check
```

Run additional affected helper tests through `pnpm test`. Unit/integration checks use mocked network/native dependencies; they do not prove a live device upload or UI flow. Load the applicable Argent skills before UI verification and use only authorized test media/accounts. Do not publish, run intl extraction/compilation, or modify generated lexicons as incidental verification.

For scoped formatting, the `pnpm prettier` script includes `--check .`. Never append `--write` without restricting that root scan. Create a temporary ignore file such as `.composer-v2-format.ignore` containing:

```gitignore
**/*
!*/
!src/components/ComposerV2/store/index.ts
```

Add one negated exact path for each touched file, then run:

```sh
pnpm prettier --write --ignore-path .composer-v2-format.ignore
pnpm prettier --ignore-path .composer-v2-format.ignore
```

Remove the temporary file afterward. Do not rewrite unrelated files or leave the ignore file in the working tree. Never stage or commit unless the operator explicitly asks.

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
- The tester exercises all implemented editing/worker/planning capabilities without migrating the production UI.
- Drafts round-trip all supported content and gate settings, with schema limitations explicit.
- Up to 10 images can produce a gallery embed.
- Images and videos use real, cancellable upload paths, including multipart video.
- Every post exposes correct shortened grapheme validity.
- Submit builds the complete thread/gate write set, validates it locally, logs it safely, and performs no repository write.
- ComposerV2 tests, project typechecks, lint, formatting checks, and relevant media tests pass.
