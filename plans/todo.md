# Composer V2 todos

Work through these in the displayed order, one at a time. Numbers remain stable for cross-references. Per operator direction, the remaining execution order is #7, #8, #9, #10, then #6 (draft round trips last). Each section can hold implementation details and notes as the work progresses.

Reference documents:

- `plans/composer-v2.md`
- `plans/composer-v2-architecture.md`

## 1. Migrate to record/media attachment slots

Status: completed

Implemented `attachments.record` and `attachments.media` in `src/components/ComposerV2/store/`. Posts, feeds, lists, and starter packs share the record slot; external cards and chat invites share the media slot with images, video, and GIFs. Each record kind can coexist with each media kind. Uploads remain simulated. The four-image cap was retained during this migration; the subsequent capacity change is tracked under #5.

- Updated URI classification, direct record insertion, slot removal, item edits, selection capacities, and the debug composer controls.
- Preserved slot-local async invalidation and retry behavior; stale results cannot restore removed attachments or overwrite the other slot.
- Kept the existing V2 collision policy: settled attachments block incoming URI candidates; pending/failed URI candidates may be replaced. Explicit record setters replace the record. Dormant link-card suggestions are not added in this step.
- Fixed snapshot isolation by cloning before applying mutations, and kept upload ownership tied to media IDs across attachment changes.
- Verification: 115 ComposerV2 tests passed; iOS/Android/web typechecks passed; project lint, changed-source formatting, and `git diff --check` passed. Debug UI was updated but not exercised on a running device.

## 2. Define `ThreadStoreInitialState`

Status: completed

Implemented `createThreadStore({resolvers, initialState})`. `ThreadStoreInitialState` in `store/types.ts` accepts ordered posts, text/languages/labels, record/media attachments, draft identity, and optional initial dirty state. Source adapters and gate state remain in #3 and #4.

- Pure builders construct the complete first snapshot with new post/item IDs and derived capacities before any background work starts.
- Omitted or empty posts create one empty post; empty image sets normalize to no media. More than 10 initial images throw before any work starts rather than silently dropping content.
- Supplied record views and card data are used directly. `{kind: 'uri', uri}` reserves its assigned slot and starts resolution.
- Images/video start eager simulated uploads; alt text, dimensions, MIME type, local refs, and captions are retained. Runtime upload state and retry functions are generated, not imported.
- Initialization, progress, and retries stay clean unless `isDirty: true` was explicitly supplied. Retry also preserves the initial slot for URLs that cannot be pre-classified.
- Verification: 148 ComposerV2 tests passed with `--watchman=false --runInBand` (the default invocation timed out); iOS/Android/web typechecks, project lint, changed-source formatting, and `git diff --check` passed.

## 3. Build the `ComposerOpts` and draft adapters

Status: completed

Implementation plan: `plans/composer-v2-adapters.md`.

Implemented and exported `composerOptsToInitialState()` and `draftToInitialState()` under `src/components/ComposerV2/adapters/`. Both return `ThreadStoreInitialState`; reply intents preserve a serializable parent preview without moderation or a fabricated root. Adapters preserve text/mention precedence, attachment order, record/media classification, local refs, captions, languages, labels, GIF metadata, and supplied record views. Unsupported or lossy draft input throws `ComposerAdapterError` with a stable code. Store initialization remains direct and simulated uploads remain unchanged.

Gate mapping is implemented in #4. Draft saving/serialization and round trips remain #6. Real uploads, production UI migration, and other later todo boundaries were not started.

Verification: 159 ComposerV2 tests passed with `--watchman=false --runInBand`; iOS/Android/web typechecks passed; project lint passed; scoped `pnpm prettier` passed; `git diff --check` passed. Work was committed by the operator as `c1dd1b145d48`.

## 4. Add postgate/threadgate state

Status: completed

Implemented serializable thread-level `threadgateAllowRules` and `postgateEmbeddingRules` in normalized initial and live state. New compositions accept caller-supplied `PostInteractionSettingsPref` through `composerOptsToInitialState` adapter options; drafts restore their own top-level gate fields and use protocol defaults when fields are absent. `undefined` threadgate rules mean everybody, `[]` means nobody, postgate `[]` allows quoting, and known plus unknown typed rules are deeply cloned and preserved. Store actions edit the shared configuration, mark real edits dirty, preserve no-op identity, and avoid background work.

Outbound draft serialization remains #6; actual gate records and submission behavior remain #9. No production UI migration or network writes were added.

Verification: 167 ComposerV2 tests passed with `--watchman=false --runInBand`; iOS/Android/web typechecks passed; project lint passed; scoped `pnpm prettier` passed; `git diff --check` passed. The initial #4 implementation is in HEAD `369612867`; this follow-up cleanup keeps adapter normalization non-owning while the store owns editable gate data. The cleanup remains uncommitted and unstaged for operator review.

## 5. Add gallery capacity

Status: completed

Per operator direction, the selection cap is now 10, independently of record serialization. Capacity checks, append limits, and tests cover the 4/5/10 boundaries and rejection beyond 10. The remaining output-selection work has moved into #9 as part of overall record-set construction; it is not implemented yet.

Verification of the capacity change: 118 ComposerV2 tests passed; iOS/Android/web typechecks, project lint, changed-source formatting, and `git diff --check` passed.

## 7. Replace simulated media workers with real eager uploads

Status: pending

## 8. Add reordering

Status: pending

## 9. Build the no-write submission planner

Status: pending

Include gallery output selection, moved from #5, in overall record-set construction: emit `app.bsky.embed.images` for 1-4 images and `app.bsky.embed.gallery` for 5-10. Combine media with any record attachment via `recordWithMedia`, construct the post/reply/gate records, and validate the complete record set without publishing. Test the image-count boundary and record-plus-media combinations in that context rather than building a standalone serializer first.

Support explicit per-post tags in composer state and normalized initial input, and populate the `tags` field on each `app.bsky.feed.post` record. These are separate from hashtag facets in the post text. Validate against the current post lexicon and cover tag preservation in planner tests. Document any draft-schema limitations for preserving tags rather than silently claiming round-trip support.

## 10. Build the production UI

Status: pending

Include a typeahead input for editing each post's explicit tags, wired to the state used to populate the post record's `tags` field. Typeahead data source and interaction details can be specified when implementing the UI.

## 6. Implement draft round trips

Status: pending

Moved to the end of the execution order per operator direction, after #10. Implement outbound draft serialization, save bookkeeping, media cleanup, and full round-trip verification against the finalized state. Existing inbound draft hydration from #3/#4 remains in place. Draft embeds use their own schema; published embed selection belongs to #9.
