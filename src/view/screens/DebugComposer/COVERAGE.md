# ComposerV2 tester - capability coverage

Developer tester at Settings > Developer options > Debug Composer V2
(`/sys/debug-composer`). It drives the real store, adapters, workers, and
planner. Publishing is a separate opt-in, one-shot action, and nothing is saved
as a draft.

Test IDs share the prefix `composerV2Tester`, omitted below. `{postId}`,
`{mediaId}`, `{index}`, and `{i}` are runtime values. Files are in this
directory; the control components are in `components/`, except `planner.ts` and
`writer.ts`, which live in
[`src/components/ComposerV2/`](../../../components/ComposerV2/).

Coverage values:

- `unit`: Jest tests in this repo.
- `manual iOS`: the iOS simulator smoke of editing, dialogs, no-write planning,
  reset, and scenarios.
- `manual web`: a Chrome run (2026-10-30) of text/facets, link cards, images,
  video, the GIF picker, multi-post gates, reply/quote, scenarios, and reset.
  Caption upload was not confirmed.
- `none`: not covered. Manual coverage is by area, not per control.

## Sessions and scenarios

| Control / feature                                                       | File                                         | Test IDs                                                                                                | Coverage                     |
| ----------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Session creation, reset, account change, unmount, stale scenario builds | `useTesterSession.ts`                        | `-reset`                                                                                                | unit, manual iOS, manual web |
| Scenarios: empty, text + link, multi-post, mention, draft fixture       | `scenarios.ts`, `SessionControls.tsx`        | `-scenario-empty`, `-scenario-text`, `-scenario-thread`, `-scenario-mention`, `-scenario-draft-fixture` | unit, manual iOS, manual web |
| Scenario: reply / quote from a real fetched post                        | `SessionControls.tsx`, `scenarios.ts`        | `-scenario-reply-quote`, `-post-url-input`, `-post-url-reply`, `-post-url-quote`                        | unit, manual web             |
| Scenario: initial media from the picker                                 | `SessionControls.tsx`, `scenarios.ts`        | `-scenario-media-picker`                                                                                | unit                         |
| Scenario build failure message (typed, static)                          | `useTesterSession.ts`, `SessionControls.tsx` | `-scenario-error`                                                                                       | unit                         |

## Editing

| Control / feature                             | File                                                 | Test IDs                                                                                   | Coverage               |
| --------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------- |
| Text with grapheme/limit feedback             | `PostCard.tsx`                                       | `-post-{postId}-text`                                                                      | manual iOS, manual web |
| Languages (up to 3), self labels              | `PostCard.tsx`                                       | `-post-{postId}-langs`, `-post-{postId}-labels`                                            | manual iOS             |
| Explicit tags (comma-separated input)         | `PostCard.tsx`, `parseTagsInput.ts`                  | `-post-{postId}-tags`                                                                      | unit, manual iOS       |
| Add, remove, reorder posts                    | `PostCard.tsx`, `DebugComposer.tsx`                  | `-add-post`, `-post-{postId}-remove`, `-post-{postId}-move-up`, `-post-{postId}-move-down` | unit, manual iOS       |
| URL attachments (typed facets, attach dialog) | `PostCard.tsx`, `RecordAttachControls.tsx`           | `-post-{postId}-attach-url`, `-attach-url-input`, `-attach-url-resolve`                    | unit, manual web       |
| Record attachment from a fetched post         | `RecordAttachControls.tsx`, `AttachmentControls.tsx` | `-attach-url-fetch-record`, `-post-{postId}-record`, `-post-{postId}-record-retry`         | none                   |
| Remove record / media attachment              | `AttachmentControls.tsx`                             | `-post-{postId}-remove-record`, `-post-{postId}-remove-media`                              | unit                   |
| Reply target display                          | `DebugComposer.tsx`                                  | `-reply-target`                                                                            | manual web             |

## Media and workers

| Control / feature                                         | File                                          | Test IDs                                                                                                                         | Coverage                  |
| --------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Media picker (images up to 10, video)                     | `PostCard.tsx`                                | `-post-{postId}-media-picker`                                                                                                    | manual web                |
| GIF picker                                                | `PostCard.tsx`                                | `-post-{postId}-gif`                                                                                                             | manual web                |
| External cards / chat invites via URL resolution          | `AttachmentControls.tsx`                      | `-post-{postId}-external-fields`                                                                                                 | unit, manual web          |
| Upload phase and progress display                         | `AttachmentControls.tsx`                      | `-post-{postId}-media`, `-media-{mediaId}`                                                                                       | unit (labels), manual web |
| Retry (per item, all failed) and terminal failure display | `AttachmentControls.tsx`, `DebugComposer.tsx` | `-media-{mediaId}-retry`, `-post-{postId}-media-retry`, `-retry-all`                                                             | unit                      |
| Alt text editing                                          | `AttachmentControls.tsx`                      | `-media-{mediaId}-alt`, `-alt-input`, `-alt-save`                                                                                | manual iOS                |
| Video captions editing (`setVideoCaptions`)               | `AttachmentControls.tsx`                      | `-media-{mediaId}-captions`, `-caption-{i}-lang`, `-caption-{i}-content`, `-caption-{i}-remove`, `-caption-add`, `-caption-save` | unit, manual iOS          |
| Capacity display                                          | `PostCard.tsx`                                | none                                                                                                                             | manual web                |
| Removal / reset while uploads run                         | store, `useTesterSession.ts`                  | `-media-{mediaId}-remove`, `-reset`                                                                                              | unit                      |

## Gates

| Control / feature                                         | File               | Test IDs                 | Coverage               |
| --------------------------------------------------------- | ------------------ | ------------------------ | ---------------------- |
| Threadgate and postgate via the shared interaction dialog | `GateControls.tsx` | `-gates-open`            | manual iOS, manual web |
| Unknown rules preserved on edits, explicit discard        | `gateRules.ts`     | `-gates-discard-unknown` | unit                   |

## Planning and publishing

| Control / feature                                                    | File                                                | Test IDs                                                                               | Coverage         |
| -------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------- |
| No-write plan with busy/success/failure states                       | `PlanSection.tsx`, `usePlanRunner.ts`               | `-plan`, `-plan-result`, `-plan-error`, `-plan-clear`                                  | unit, manual iOS |
| Redacted structural summary and expandable structure view            | `PlanSection.tsx`, `summarizeComposerV2Plan.ts`     | `-plan-structure-toggle`, `-plan-structure`, `-plan-post-{index}-structure`            | unit, manual iOS |
| Full planned records as selectable JSON                              | `PlanSection.tsx`                                   | `-plan-records`                                                                        | unit             |
| Static error hints per code                                          | `PlanSection.tsx`, `messages.ts`                    | `-plan-error`                                                                          | unit             |
| Stale marking after edits; cleared on reset, session, account change | `usePlanRunner.ts`                                  | `-plan-stale`                                                                          | unit             |
| Empty-post confirmation re-plan                                      | `PlanSection.tsx`, `usePlanRunner.ts`               | `-plan-confirm-skip`                                                                   | unit             |
| Required-alt-text preflight toggle                                   | `DebugComposer.tsx`, `PlanSection.tsx`              | none                                                                                   | none             |
| Publish checkbox, one-shot publish, retained plan, planned URIs      | `DebugComposer.tsx`, `PlanSection.tsx`, `writer.ts` | `-publish-controls`, `-publish-enable`, `-publish`, `-publish-status`, `-publish-uris` | unit             |

## Diagnostics

| Control / feature                                        | File               | Test IDs                           | Coverage |
| -------------------------------------------------------- | ------------------ | ---------------------------------- | -------- |
| Redacted state summary                                   | `StateSummary.tsx` | `-summary-toggle`, `-summary-dump` | none     |
| Translated strings through compiled Lingui message hooks | `messages.ts`      | none                               | unit     |

## Not covered

- Android UI.
- Paste and drag-and-drop media input (adapter and store tests only; no
  composer text input is wired to it).
- Real publishing: the writer is unit-tested with fake clients, and no run
  published a post or gate.
