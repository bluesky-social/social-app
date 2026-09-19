# Composer V2 completed milestone history

This archives the completed milestones from the former `plans/todo.md`. The numbers below are legacy milestone IDs, not the numbered task IDs in `AGENTS/tasks/`. Verification counts describe historical implementation reports; they were not rerun during this documentation migration.

The only active execution queue is `AGENTS/tasks/`, with the operator-approved order in `AGENTS/tasks/README.md`. Remaining feature work was migrated without changing its relative order:

| Legacy milestone                                        | Current task                                               |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| #8 Reordering                                           | `AGENTS/tasks/0005-task-composer-v2-post-reordering.md`    |
| #9 Record-set planner, including #5 gallery output      | `AGENTS/tasks/0006-task-composer-v2-record-set-planner.md` |
| #10 UI, now scoped to the tester; production UI dropped | `AGENTS/tasks/0007-task-composer-v2-production-ui.md`      |
| #6 Draft round trips, last                              | `AGENTS/tasks/0008-task-composer-v2-draft-round-trips.md`  |

Cleanup tasks 0001-0003 precede the migrated feature work. The operator subsequently moved cleanup 0004 to immediately before drafts (0008), after the tester UI. By subsequent operator direction, task 0007 completes the tester UI instead of a production UI; its existing filename is retained. Drafts remain last. Task frontmatter, not this archive, is authoritative for pending/completed status.

Reference documents:

- `plans/composer-v2.md`: current requirements and development checks.
- `plans/composer-v2-architecture.md`: current architecture.
- `plans/archive/composer-v2-adapters.md`: historical implementation brief for legacy #3.

## 1. Migrate to record/media attachment slots

Status: completed

Implemented `attachments.record` and `attachments.media` in `src/components/ComposerV2/store/`. Posts, feeds, lists, and starter packs share the record slot; external cards and chat invites share the media slot with images, video, and GIFs. Each record kind can coexist with each media kind. Uploads were still simulated at this milestone; legacy #7 below replaced them with real workers. The four-image cap was retained during this migration; the subsequent capacity change is tracked under legacy #5.

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

Archived implementation plan: `plans/archive/composer-v2-adapters.md`.

Implemented and exported `composerOptsToInitialState()` and `draftToInitialState()` under `src/components/ComposerV2/adapters/`. Both return `ThreadStoreInitialState`; reply intents preserve a serializable parent preview without moderation or a fabricated root. Adapters preserve text/mention precedence, attachment order, record/media classification, local refs, captions, languages, labels, GIF metadata, and supplied record views. Unsupported or lossy draft input throws `ComposerAdapterError` with a stable code. Store initialization remains direct and simulated uploads remain unchanged.

Gate mapping is implemented in #4. Draft saving/serialization and round trips remain #6. Real uploads, production UI migration, and other later todo boundaries were not started.

Verification: 159 ComposerV2 tests passed with `--watchman=false --runInBand`; iOS/Android/web typechecks passed; project lint passed; scoped `pnpm prettier` passed; `git diff --check` passed. The implementation is committed as `4533b1346` in the current history.

## 4. Add postgate/threadgate state

Status: completed

Implemented serializable thread-level `threadgateAllowRules` and `postgateEmbeddingRules` in normalized initial and live state. New compositions accept caller-supplied `PostInteractionSettingsPref` through `composerOptsToInitialState` adapter options; drafts restore their own top-level gate fields and use protocol defaults when fields are absent. `undefined` threadgate rules mean everybody, `[]` means nobody, postgate `[]` allows quoting, and known plus unknown typed rules are deeply cloned and preserved. Store actions edit the shared configuration, mark real edits dirty, preserve no-op identity, and avoid background work.

Outbound draft serialization remains #6; actual gate records and submission behavior remain #9. No production UI migration or network writes were added.

Verification: 167 ComposerV2 tests passed with `--watchman=false --runInBand`; iOS/Android/web typechecks passed; project lint passed; scoped `pnpm prettier` passed; `git diff --check` passed. The initial #4 implementation is committed as `62a48e949`; cleanup commit `da41f10ca` keeps adapter normalization non-owning while the store owns editable gate data. Both are committed.

## 5. Add gallery capacity

Status: completed

Per operator direction, the selection cap is now 10, independently of record serialization. Capacity checks, append limits, and tests cover the 4/5/10 boundaries and rejection beyond 10. The remaining output-selection work has moved into #9 as part of overall record-set construction; it is not implemented yet.

Verification of the capacity change: 118 ComposerV2 tests passed; iOS/Android/web typechecks, project lint, changed-source formatting, and `git diff --check` passed.

## 7. Replace simulated media workers with real eager uploads

Status: completed

Replaced timer-based image/video workers with explicit production dependencies: PDS lex client, account dispatch URL, localization, and injectable media primitives. Selected and hydrated media starts eagerly after the complete initial snapshot is published. Original sources, local refs, editable captions, transformed outputs, uploaded video/caption refs, and distinct validating/compression/upload/processing/caption phases are retained.

Images use `compressImage` with `IMAGE_SIZE_CONFIG_POSTS` and the platform blob-upload helper. Videos validate metadata and policy limits, use `compressVideo`, delegate through `uploadVideo()` to the existing `uploadVideoMultipart()` engine, poll unfinished jobs with cancellation, and upload VTT captions through the PDS. Missing dependencies fail explicitly; there is no production simulation fallback. Image compression cancellation is logical because the existing primitive has no signal; cancelled results never begin upload. Prepared output and final callbacks are guarded by media task ownership, including synchronous worker callbacks. Retryable and terminal failures are classified, and completed video blobs survive caption failures.

Tests use injected deterministic fakes for store-only invariants and mocked real-worker dependencies; no live-account upload or repository write was added. Verification: `pnpm test src/components/ComposerV2 --watchman=false --runInBand` (8 suites, 173 tests passed), `pnpm test src/lib/media/video --watchman=false --runInBand` (7 suites, 41 tests passed), `pnpm typecheck` (iOS/Android/web passed), scoped `pnpm prettier --write .` with a temporary restrictive ignore (passed), lint via the repository Oxlint script with `--format default` (0 errors, 229 warnings), and `git diff --check` (passed). The unredirected lint display in this harness reports a JSON parser EOF despite the underlying command exiting 0 with no errors.

Committed as `5a343bc65`. The UI-free image-compression import cleanup is tracked separately in task 0004. Remaining feature work lives in tasks 0005-0008, with draft round trips last; see the migration table above.
