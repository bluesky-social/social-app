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

There is currently no single top-level error event:

- Upload failures live on media items with a message and optional code/retryability.
- URI-resolution failures live on attachment slots with code/message and optional retry.
- Initial-state adapters throw typed `ComposerAdapterError` instances; construction can also throw.
- Planning returns structured `{ok: false, errors}` results.
- The separate writer in task 0010 propagates write failures.
- `store.subscribe()` reports state changes, not errors.

Discuss a small typed per-composer-session `onError` callback shared by the store and initialization/planning/writing callers. No global event bus or large error framework. Proposed reporting context: source, stable code, relevant post/media IDs, and recovery classification (retry, edit, reconcile uncertain write outcome, or none).

Requirements to settle before implementation:

- Keep persistent failure state and operation results authoritative; notifications must not replace them.
- Report once per accepted failed attempt, not on each render or upload-progress update.
- Do not report intentional cancellation or ignored stale work as errors.
- Separate ordinary validation/preflight issues from operational failures and programmer bugs; do not send every missing-alt-text warning to crash reporting or a global toast.
- Separate safe localized UI messages from diagnostic causes. Avoid dumping post text, local paths, caption contents, or complete records into logs.
- Preserve unexpected diagnostic causes: the planner currently reduces unexpected exceptions to a generic result, while URI-resolution state retains raw exception messages.
- Register reporting at construction so eager initialization failures are observable.
- Isolate exceptions thrown by notification listeners so reporting cannot interrupt cleanup/state updates or other listeners.
- Treat ambiguous write failures specially: do not automatically replan with fresh keys and retry a potentially committed post. Preserve the writer's SDK failure for caller handling.

This discussion does not authorize implementing reporting, publishing controls, or expanding task 0010.

## 4. Final publish-boundary validation: already covered

No additional task is requested. The planner already validates generated records and the complete applyWrites input. Task 0010 covers the thin writer's authenticated-account match and requirement to retain server-side `validate: true`. This does not claim task 0010 is complete or authorize live writes for verification.
