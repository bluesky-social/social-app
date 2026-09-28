# ComposerV2 follow-up discussions

These are follow-up discussions requested by the operator. Items remain discussion-only unless explicitly marked approved below. Executable task briefs remain in `AGENTS/tasks/`.

The public/internal action-surface cleanup is separately queued as `AGENTS/tasks/0011-task-composer-v2-internal-actions.md`.

## 2. Make upload failure types match runtime behavior

Previously, `PostMediaUploadStatus` in `src/components/ComposerV2/store/types.ts` required a `retry` function on every failed upload, while `setUploadStatus()` omitted it for terminal failures and cast the result. Task 0012 corrected that mismatch.

Implemented and verified by Luna: `AGENTS/tasks/0012-task-composer-v2-upload-failure-types.md`.

Use explicit stored variants: `retryable: true` with a required retry function, or `retryable: false` without one. Keep worker reports unchanged and normalize their optional flag at the store boundary, preserving the existing default that omission permits retry. Remove the cast hiding the mismatch and verify both runtime behavior and type narrowing.

Scope stays on type/runtime agreement, not redesigning the upload lifecycle.

## 3. Test store invariants across action sequences

Completed in commit `1aa1a4d8ec41` (`Guard media upload retries against stale and active attempts`). Astra added `store/__tests__/sequences.test.ts` with four reproducible seeds of 60 operations, explicit stale-callback cases, and caption retry integration coverage. The work also fixed individual retries restarting active attempts and retained retry closures affecting superseding failures. The final test log records 319 passing ComposerV2 tests across 22 suites.

Original scope: complement individual action tests with deterministic generated/model-based sequences of add, remove, reorder, replace, edit, and retry operations. Control async worker/resolver completion order, including late success/failure after replacement, removal, retry, or destruction.

Candidate invariants:

- One record slot and one media slot, with valid media-kind exclusivity and image limits.
- Derived capacities agree with the active media attachment.
- Media IDs and post ownership remain consistent across changes/reordering.
- Removed/replaced attempts cannot update current state or resurrect attachments.
- Published previous snapshots remain unchanged.
- Destroyed stores do not accept async results or notify subscribers.
- Retries do not restart active work or dirty user content by themselves.

Distinguish internal corruption from legitimate but not-yet-publishable editing states: empty/overlength text, pending uploads, and recoverable failures must remain representable.

Implemented using existing test seams and reproducible seeds, without a new testing dependency.

## Error handling: one per-session reporting callback

Completed and verified by Astra 6 with explicit operator approval, superseding the previous discussion-only disclaimer. Implementation is uncommitted for parent review. No other follow-up todo or feature was authorized or started.

- `src/components/ComposerV2/errors.ts` defines optional synchronous `ComposerV2OnError(event, cause?)`. The event contains source, stable code, validation/operational/unexpected kind, relevant local post/media IDs, and retry/edit/reconcile/none recovery. Raw diagnostic causes are separate from structural metadata; no default logging, toast, event bus, or subscription sink is installed.
- `createThreadStore({onError})` registers the policy before normalization and eager workers start. Its `reportError` callback shares that policy with operation callers and becomes inert on destruction. Accepted upload/URI failures report once; stale/cancelled work and repeated callbacks do not. A new failed retry is a new report. Existing retry classification, stale-attempt guards, resolution lanes, dirty state, and partial video/caption reuse remain intact.
- Adapters, planner, and writer accept the same optional callback. Report at one owning boundary rather than again when catching a reported rejection. Tester scenario/plan tokens suppress superseded work, including unmounts, and replaced stores are retired immediately. The tester's existing explicit publisher and retained uncertain-write notice remain in place.
- Source-local failures and operation outcomes remain authoritative. Ordinary planner preflight, record validation, and failures already present in the snapshot stay structured local results, not new operational reports. Adapter errors retain their typed rejection; unexpected initialization causes remain available. Planner errors preserve original causes non-enumerably, outside serialized results and UI summaries. URI failure state no longer contains exception messages; the tester localizes guidance from the stable code.
- Callback exceptions cannot replace results/errors, interrupt state/cleanup, or recursively report themselves. Writer failures retain the original SDK error. Any failure after dispatch, including a transport abort, conservatively requests reconciliation of the retained plan. Authenticated DID/repo checks, `validate: true`, and exactly one unchanged `applyWrites` call remain; no automatic retry/replan was added.

Verification (fake clients/workers only):

- `pnpm test src/components/ComposerV2 --watchman=false --runInBand`: 357 tests passed across 23 suites, including the existing sequence suite and new reporting/lifetime/diagnostic isolation coverage.
- `pnpm typecheck`: iOS, Android, and Web passed.
- `pnpm lint`: passed, including the Sentry browser-version check.
- Scoped `pnpm prettier`: passed for the 20 changed ComposerV2 source/test files, using a temporary allowlist ignore file because the repository script includes `.`. No unscoped formatting write.
- `git diff --check`: passed. Pnpm checks were captured via Node child processes in `/tmp/composer-v2-{test,typecheck,lint,prettier}.log`, each with exit status 0. Existing tooling warnings (pnpm version mismatch, Prettier config module type, mocked GrowthBook initialization, and Jest force-exit notice) did not fail checks.

No live upload, publication, networking-based integration test, or simulator interaction was performed. No task file, staging, commit, production migration, or new UI/error panel was added.

## 4. Final publish-boundary validation: already covered

No additional task is requested. The planner already validates generated records and the complete applyWrites input. Task 0010 covers the thin writer's authenticated-account match and requirement to retain server-side `validate: true`. This does not claim task 0010 is complete or authorize live writes for verification.
