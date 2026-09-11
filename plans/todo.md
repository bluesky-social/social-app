# Composer V2 todos

Work through these in order, one at a time. Each section can hold implementation details and notes as the work progresses.

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

Status: pending

## 3. Build the `ComposerOpts` and draft adapters

Status: pending

## 4. Add postgate/threadgate state

Status: pending

## 5. Add gallery capacity and output selection

Status: in_progress

Per operator direction, the selection cap is now 10, independently of record serialization. Capacity checks, append limits, and tests cover the 4/5/10 boundaries and rejection beyond 10. Output selection remains to be implemented: `app.bsky.embed.images` for 1-4 images and `app.bsky.embed.gallery` for 5-10.

Verification of the capacity change: 118 ComposerV2 tests passed; iOS/Android/web typechecks, project lint, changed-source formatting, and `git diff --check` passed.

## 6. Implement draft round trips

Status: pending

## 7. Replace simulated media workers with real eager uploads

Status: pending

## 8. Add reordering

Status: pending

## 9. Build the no-write submission planner

Status: pending

## 10. Build the production UI

Status: pending
