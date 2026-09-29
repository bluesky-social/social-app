# ComposerV2 tester - capability coverage

Tester UI for task 0007, reachable at Settings > Developer options > Debug
Composer V2 (`/sys/debug-composer`). The tester drives the real
store/adapters/workers/planner; an explicit one-shot publishing action is
available only after enabling its checkbox, and there is no draft persistence.

Legend for "verified": `unit` = covered by jest tests in this repo,
`parent-pending` = interactive iOS verification owned by the parent session
(not claimed as passed here), `n/a` = nothing to verify beyond the above.

Files in the "Where" columns live in this directory, except `planner.ts` and
`writer.ts`, which live in
[`src/components/ComposerV2/`](../../../components/ComposerV2/).

## Final verification

- Checks passed: 279 ComposerV2 tests, 8 existing composer tests, iOS/Android/web
  typechecks, lint, and source formatting.
- iOS smoke check via Argent: Settings entry, empty-session rendering, post
  text editing and grapheme feedback, inline comma-separated tags, and a
  successful no-write plan. Input `qa, tester, , trimmed ` produced three
  planned tags; the plan reported one post, one write, and 14 graphemes.
- The matrix below records broader coverage; `parent-pending` means the full
  interaction remains unverified beyond that smoke check. Native picker/upload
  paths and remaining dialogs were not fully exercised. Web and Android UI
  were not exercised. No post or gate was published.

## Record inspection

Successful plans also display the complete `applyWrites` writes array as
selectable, formatted JSON, including post and gate record contents. External
attachments show their complete resolved fields (including descriptions,
thumbnail metadata, associated refs, and supplied views), plus a thumbnail
preview when available. These contents are intentionally visible in the tester
and are not logged automatically. They are sent to the PDS only after the
publishing checkbox is enabled and the explicit publish button is pressed. The
separate state summary remains redacted.

## Sessions and initialization

| Capability                                                                                         | Where                                           | Verified                                            |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| Isolated session creation through `createThreadStore` + normalized input, never live actions       | `useTesterSession.ts`                           | unit + parent-pending                               |
| Reset destroys the old store and remounts uncontrolled inputs (session key)                        | `useTesterSession.ts`, `DebugComposer.tsx`      | unit (destroy/key) + parent-pending (input remount) |
| Account change destroys the session and starts empty                                               | `useTesterSession.ts`                           | unit                                                |
| Unmount destroys the store                                                                         | `useTesterSession.ts`                           | unit                                                |
| Stale async scenario builds cannot populate a newer session                                        | `useTesterSession.ts`                           | unit                                                |
| Unmount invalidates in-flight scenario builds (no ownerless stores/workers)                        | `useTesterSession.ts`                           | unit                                                |
| Scenario build failures surface as typed static messages, never raw exception text                 | `useTesterSession.ts`, `SessionControls.tsx`    | unit (shape) + parent-pending (render)              |
| Scenarios: empty, text+link, mention (real handle)                                                 | `scenarios.ts` via `composerOptsToInitialState` | unit                                                |
| Scenario: normalized multi-post (langs/labels/tags)                                                | `scenarios.ts`                                  | unit                                                |
| Scenario: reply / quote from a real fetched post (no fabricated refs)                              | `SessionControls.tsx` + `scenarios.ts`          | unit (builder) + parent-pending (fetch)             |
| Scenario: initial media from the real picker                                                       | `SessionControls.tsx` + `scenarios.ts`          | unit (mapping) + parent-pending (picker)            |
| Clearly labelled inbound draft fixture through `draftToInitialState` (adapter only; nothing saved) | `scenarios.ts`                                  | unit                                                |

## Editing

| Capability                                                                 | Where                                          | Verified                                     |
| -------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Text editing with grapheme/limit feedback (300, URL-shortened)             | `PostCard.tsx` + `CharProgress`                | parent-pending                               |
| Languages (up to 3) per post                                               | `PostCard.tsx` + `LanguageSelectDialog`        | parent-pending                               |
| Self labels per post                                                       | `PostCard.tsx` + shared `LabelsBtn`            | parent-pending                               |
| Explicit tags: inline comma-separated input (separate from hashtag facets) | `PostCard.tsx` TagsInput + `parseTagsInput.ts` | unit (store + parsing) + parent-pending (UI) |
| Add / remove / reorder posts                                               | `PostCard.tsx`, `DebugComposer.tsx`            | unit (store) + parent-pending (UI)           |
| URL attachments via typed-text facets and the attach dialog (`addUri`)     | `PostCard.tsx`, `RecordAttachControls.tsx`     | parent-pending                               |
| Direct record attachment from a real fetched post (`setRecordAttachment`)  | `RecordAttachControls.tsx`                     | parent-pending                               |
| Attachment removal (record slot, media slot, single items)                 | `AttachmentControls.tsx`                       | unit (store) + parent-pending (UI)           |

## Media and workers

| Capability                                                                                                                                          | Where                                         | Verified                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| Real native/web media picker (shared `SelectMediaButton`), images up to 10                                                                          | `PostCard.tsx`                                | parent-pending                           |
| GIF picker (shared `GifPickerDialog`)                                                                                                               | `PostCard.tsx`                                | parent-pending                           |
| External cards / chat invites via URL resolution                                                                                                    | store `addUri`                                | parent-pending                           |
| Eager real upload workers, phase/progress display (validating/compressing/uploading/processing/captions)                                            | `AttachmentControls.tsx`                      | parent-pending                           |
| Retryable vs terminal failure display, per-item retry, retry-all with count                                                                         | `AttachmentControls.tsx`, `DebugComposer.tsx` | unit (store retry) + parent-pending (UI) |
| Alt text editing for image/video/GIF (`updateMediaAltText`)                                                                                         | `AttachmentControls.tsx`                      | parent-pending                           |
| Video captions editing via new narrow `setVideoCaptions` action (stale caption blobs pruned, completed video blob reused, in-flight work restarted) | store + `AttachmentControls.tsx`              | unit                                     |
| Capacity display (images/video/GIF selections remaining)                                                                                            | `PostCard.tsx`                                | parent-pending                           |
| Removal/reset while uploads run (cancellation, no cross-session leakage)                                                                            | store + `useTesterSession.ts`                 | unit                                     |

## Gates

| Capability                                                                                               | Where              | Verified       |
| -------------------------------------------------------------------------------------------------------- | ------------------ | -------------- |
| Threadgate everybody/nobody/mention/followers/following/list via the shared interaction-settings dialog  | `GateControls.tsx` | parent-pending |
| Shared postgate quote toggle                                                                             | `GateControls.tsx` | parent-pending |
| Unknown threadgate/postgate rules preserved on edits, never silently broadened; explicit discard control | `gateRules.ts`     | unit           |

## Planning and explicit publishing

| Capability                                                                                                                                                      | Where                                                      | Verified                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| No-write plan with busy/success/failure states                                                                                                                  | `PlanSection.tsx`, `usePlanRunner.ts`                      | unit + parent-pending                                   |
| Exact successful plan retained for an explicit writer action; publishing checkbox gates a one-shot publish button                                               | `usePlanRunner.ts`, `PlanSection.tsx`, `DebugComposer.tsx` | unit (plan retention, checkbox gating) + parent-pending |
| Write status retains the captured plan and lists planned URIs; rejected calls are treated as ambiguous and are never retried automatically                      | `DebugComposer.tsx`, `writer.ts`                           | unit (writer errors) + parent-pending                   |
| Redacted structural results: order, rkeys, embed type (incl. 4/5-image images-vs-gallery switch), reply flags, writes per collection (post/threadgate/postgate) | `PlanSection.tsx` via `summarizeComposerV2Plan.ts`         | parent-pending                                          |
| Expandable structure view: final at:// URIs, actual reply root/parent relationships (in-plan targets shown by post position), per-post gate associations        | `PlanSection.tsx` `PlanStructure`                          | unit (summary fields) + parent-pending (UI)             |
| Actionable static hints per error code                                                                                                                          | `PlanSection.tsx` via `messages.ts`                        | unit (non-empty translated output per code)             |
| Stale marking after edits; cleared on reset/session/account change; an old async plan never populates a different session                                       | `usePlanRunner.ts`                                         | unit                                                    |
| Empty-post confirmation contract (`empty-post-requires-confirmation` -> explicit re-plan with confirmation)                                                     | `PlanSection.tsx`                                          | unit (runner flag) + parent-pending (UI)                |
| Required-alt-text preflight toggle (initialized from preference)                                                                                                | `DebugComposer.tsx`, `PlanSection.tsx`                     | parent-pending                                          |
| Publishing calls only the dedicated ComposerV2 writer; the planner remains no-write and production composer is not wired to it                                  | `DebugComposer.tsx`, `writer.ts`, `planner.ts`             | unit + code review                                      |

## Diagnostics and safety

| Capability                                                                                                                                  | Where               | Verified       |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------- |
| Redacted state summary (structure/readiness only; no text, captions, paths, blobs, auth)                                                    | `StateSummary.tsx`  | unit           |
| Translated strings built only through compiled Lingui macro bindings (`messages.ts` hooks); regression-tested against a real Lingui runtime | `messages.ts`       | unit           |
| Explanatory admonition: uploads real, planning never publishes, nothing saved                                                               | `DebugComposer.tsx` | parent-pending |
| Stable test IDs + translated accessibility labels on every interactive control                                                              | all components      | parent-pending |

## Known limitations

- Publishing is explicitly opt-in and one-shot per tester mount. Any rejected
  write is treated as ambiguous: the exact plan stays in memory and cannot be
  retried through this UI. There is no reconciliation engine or durable plan
  storage, so unmounting the tester discards that in-memory plan.
- Draft saving/restoring is task 0008; the adapter fixture is synthetic and
  clearly labelled.
- The production tag typeahead is intentionally out of scope.
- The draft fixture intentionally carries no network-bearing media: a
  fabricated provider URL would trigger real thumbnail/upload requests at
  runtime. GIFs/cards enter the tester only through the real picker and URL
  resolution; the adapter's GIF-URL parsing is unit-tested with test-local
  synthetic data instead.
- Native dialogs portal their children to the app shell's bottom-sheet
  outlet, outside this screen's providers. Every tester dialog whose content
  reads the thread store (alt text, captions, attach URL) re-provides the
  owning store inside `Dialog.Outer`; `dialogPortalContext.test.tsx` renders
  dialog children through the real portal group at the tree root to keep
  this honest. The gate dialog stays mounted (production `ThreadgateBtn`
  pattern) so `control.open()` is attached on the first tap.
- Live verification is limited to the iOS smoke check above. Unit tests do
  not establish full picker, upload, dialog, preview, or cross-platform UI
  coverage.

## Test ID index

Prefix `composerV2Tester`. Session: `-scenario-empty|text|thread|draft-fixture|mention`,
`-scenario-reply-quote`, `-scenario-media-picker`, `-reset`, `-scenario-error`,
`-post-url-input`, `-post-url-reply`, `-post-url-quote`.
Thread: `-add-post`, `-retry-all`, `-reply-target`.
Per post (`-post-{postId}`): `-text`, `-move-up`, `-move-down`, `-remove`,
`-media-picker`, `-gif`, `-langs`, `-labels`, `-tags`, `-attach-url`,
`-record`, `-remove-record`, `-record-retry`, `-media`, `-remove-media`,
`-media-retry`.
Per media item (`-media-{mediaId}`): `-alt`, `-captions`, `-retry`, `-remove`.
Dialogs: `-alt-input`, `-alt-save`, `-caption-{i}-lang|content|remove`,
`-caption-add`, `-caption-save`, `-attach-url-input`, `-attach-url-resolve`,
`-attach-url-fetch-record`.
(`-post-{postId}-tags` is the inline comma-separated tags input.)
Gates: `-gates-open`, `-gates-discard-unknown`.
Plan: `-plan`, `-plan-confirm-skip`, `-plan-clear`, `-plan-stale`,
`-plan-result`, `-plan-errors`, `-plan-structure-toggle`, `-plan-structure`,
`-plan-post-{index}-structure`, `-publish-enable`, `-publish`, `-publish-status`,
`-publish-uris`.
Summary: `-summary-toggle`, `-summary-dump`.
