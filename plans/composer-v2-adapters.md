# Composer V2: initial-state adapters (todo #3)

## Goal

Implement the two inbound adapters that transform existing app inputs into `ThreadStoreInitialState`:

```text
ComposerOpts -----------------> composerOptsToInitialState() --+
                                                             |
Saved draft + loaded media ---> draftToInitialState() --------+--> createThreadStore({resolvers, initialState})
```

Both adapters return the same normalized initial-state contract. Neither adapter constructs a store or dispatches store actions. All runtime IDs, pending/upload statuses, retry callbacks, and background work remain owned by the store.

## Implemented API

Todo #3 is complete. The exports in `src/components/ComposerV2/adapters/` are:

```ts
composerOptsToInitialState(
  opts: ComposerOpts,
  metadataOptions?: AdapterMetadataOptions,
): Promise<ThreadStoreInitialState>

draftToInitialState(input: DraftToInitialStateInput): Promise<ThreadStoreInitialState>
```

`AdapterMetadataOptions` injects image-dimension and video-metadata probes for
local deterministic tests. It also accepts optional
`postInteractionSettings` for new-composition gate defaults. `ComposerAdapterError`
exposes a stable `code` for missing media, failed metadata, conflicting or
oversized attachments, and unsupported draft data. `ThreadStoreInitialState.replyTo`
and `ThreadState.replyTo` carry only the serializable parent preview; no root is
fabricated and moderation is omitted. The adapters map shared thread-level
`threadgateAllowRules` and `postgateEmbeddingRules`; draft fields win over
preferences, and absent draft fields use protocol defaults. Unknown typed rules
are cloned and preserved. Draft serialization/saving remains todo #6. Uploads
remain simulated.

This is todo #3 in `plans/todo.md`. Do not start another todo, commit changes, or delegate this work further.

## Current implementation

- `src/components/ComposerV2/store/types.ts` defines `ThreadStoreInitialState`, `ThreadPostInitialState`, source media inputs, and record/media attachment types.
- `src/components/ComposerV2/store/utils/buildThreadState.ts` and `buildThreadPost.ts` construct initial snapshots.
- `createThreadStore({resolvers, initialState})` already supports ordered posts, text/languages/labels, local refs, captions, supplied record/card data, URI-only candidates, draft identity, and initial dirty state.
- The store generates fresh post/media IDs and starts simulated image/video uploads and URI resolution eagerly after building the complete snapshot.
- Supplied resolved attachments are not refetched. `{kind: 'uri', uri}` reserves the adapter-selected slot.
- Initial image sets over 10 throw before any work starts; empty image sets normalize to no media.
- The store now has minimal reply context and shared thread-level gate state.
  `undefined` threadgate rules mean everybody, `[]` means nobody, and postgate
  rules default to `[]` (quoting allowed).
- The existing ComposerV2 suite has 148 tests. The default Jest invocation previously timed out; use the Watchman-disabled command below.

## Scope and constraints

Implement:

1. `composerOptsToInitialState()`.
2. `draftToInitialState()`.
3. Minimal source-independent reply context in initial/live thread state, needed for reply intents.
4. Focused conversion helpers and tests, including adapter-to-store integration.
5. Documentation and todo status updates describing the actual implementation.

Do not implement:

- Draft serialization, saving, deletion, orphan-media cleanup, or round trips:
  todo #6 owns writing the normalized gate fields back to the draft schema.
- Real compression, uploads, or multipart video: todo #7.
- Reordering, submit planning, or production composer UI integration.
- Dormant external-card suggestions, a new shell API, or a generic migration framework.

Keep `ComposerOpts` unchanged for existing callers. Put the new adapters near V2, preferably under `src/components/ComposerV2/adapters/`, with co-located tests. Use the current lex clients and `#/lexicons` types, never `@atproto/api` or the removed agent APIs.

## 1. Shared adapter contract

- Both adapters produce `ThreadStoreInitialState`, not separate source-specific store shapes. Gate settings are top-level shared configuration, not per-post fields.
- Async adapters are fine where local media metadata must be probed; complete normalization before constructing the store.
- Accept loaded draft media from the caller. Do not load, copy, persist, or delete draft files inside the conversion layer.
- Keep local metadata access narrow and injectable for deterministic tests. Reuse existing image/video metadata primitives rather than inventing another pipeline.
- Preserve input order and do not mutate caller data.
- Do not resolve post/feed/list/link views or start uploads in the adapters. Pass known record refs/views directly; otherwise emit URI candidates into the appropriate slot.
- Do not extract callbacks, moderation objects with runtime behavior, or UI intents into the initial-state data. The caller retains the original `ComposerOpts` for those concerns.

## 2. `ComposerOpts` conversion

Reference the existing contract in `src/state/shell/composer/index.tsx` and initialization behavior in `src/view/com/composer/state/composer.ts:createComposerState`.

### Text and mentions

- Preserve supplied text, including whitespace and Unicode; submit-time normalization is not part of this task.
- Preserve the current precedence of initial text versus mention-generated text. Use the existing mention helper rather than approximating its spacing behavior.
- Inspect facets in initial text using `@bsky/sdk/richtext` and the existing URL helpers. Explicit attachments take precedence over detected suggestions.
- Pick at most one record candidate and one media candidate using the same record/media classification as V2. Do not accidentally treat feed/list/starter-pack URLs as external media.
- With explicit local media present, do not also install a detected external card. Do not implement dormant suggestions here.
- Do not add rich-text class instances or a second grapheme counter to state; the existing hook derives those values.

### Quotes and other attachments

- A supplied `quote` becomes a resolved post-kind record attachment with its original strong ref and view. Do not refetch it or convert it unnecessarily to a URL.
- A supplied quote wins over a detected record URL in the initial text.
- Convert `imageUris` into an images attachment preserving order, dimensions, and alt text.
- Convert `videoUri` into a video source preserving its URI and dimensions; obtain MIME type using existing platform metadata support where needed. Do not guess MIME solely from an unreliable extension or begin video processing in the adapter.
- Explicitly reject conflicting explicit image/video inputs rather than silently dropping one. Valid input combinations include quote + images, quote + video, and quote + detected external card.
- Respect the 10-image limit. Do not silently truncate oversized explicit input.

### Shell-only fields

- `onPost`, `onPostSuccess`, `logContext`, and `openGallery` remain on the original shell intent.
- In particular, preserve `openGallery` as caller-owned UI behavior, not a field masquerading as post data.
- Do not change existing open-composer call sites or bypass existing auth/block checks.

## 3. Reply context

Add the smallest useful serializable reply-target representation to `ThreadStoreInitialState` and `ThreadState`, with initial-builder support.

- Preserve the parent URI/CID from `ComposerOpts.replyTo` and the plain preview fields needed to display it: text, languages, author, and embed where appropriate.
- Do not store callbacks or a runtime `ModerationDecision` in thread state.
- Do not fabricate a root ref. `ComposerOptsPostRef` does not contain the parent post record or its thread root. Leave an unknown root unresolved for the submission layer to fetch later; preserve a root if the chosen normalized representation explicitly supports a known one.
- Copy editable data as appropriate and keep initialization clean.
- Replies are independent of attachment slots: a reply can also contain a quote and media.
- The current draft lexicon has no reply-target field. Do not invent a field on the draft schema or infer a reply target from its embedded record.

## 4. Draft conversion

Suggested arguments: an object containing `draftId`, the `app.bsky.draft.defs.Draft`, and a caller-provided loaded-media map keyed by `localRef.path`. The exact signature may be refined for clarity while keeping the output contract shared.

References:

- `src/lexicons/app/bsky/draft/defs.defs.ts` is authoritative for current draft data.
- `src/view/com/composer/drafts/state/api.ts` has the existing local-ref, GIF, image, and video conventions.
- `src/view/com/composer/Composer.tsx` contains current video restore metadata handling.

### Posts and metadata

- Preserve post order, text, and supported self-label values.
- Draft languages are stored at `draft.langs`, not per post. Map them to each normalized post's `langs`.
- Set `draftId` and `isDirty: false`.
- Defaults should match the normalized constructor's semantics, not initialize through live edit actions.

### Images and gallery

- Read both legacy `embedImages` and `embedGallery` image entries.
- Retain the existing legacy-then-gallery ordering if both image representations are present; do not deduplicate refs without evidence that they are accidental duplicates.
- Resolve each `localRef.path` through the supplied loaded-media map, probe dimensions where necessary, and preserve alt text and the original `localRefPath`.
- Preserve the loaded source URI; do not copy media simply to build a new image object.
- Keep the combined set within the 10-image authoring limit. Unsupported gallery entries and oversized input must not disappear silently.

### Video

- Restore the single video's loaded URI, dimensions, MIME type, local ref, alt text, and all captions.
- Follow existing MIME-in-localRef conventions. Reuse native/web metadata support; avoid reimplementing the compression pipeline.
- Captions remain language/content data. Do not build upload tasks or caption blob refs in the adapter.

### GIFs and external candidates

- Support existing Tenor and Klipy draft URL conventions, including encoded dimensions and alt text.
- Reconstruct the GIF source data needed by the current picker/resolver types, preserving meaningful provider URL parameters.
- Do not reinterpret arbitrary external URLs as GIFs based only on their suffix.
- Non-GIF URLs become record or media URI candidates according to their actual recognized URL kind. Existing drafts may store feed/list/starter-pack URLs in `embedExternals`.

### Record refs

- Preserve known strong refs from `embedRecords` without fetching a view.
- Inspect the AT URI collection to distinguish post, feed generator, list, and starter pack; do not assume all record refs are quotes.
- Unsupported record collections must be reported explicitly rather than relabeled as posts.

### Unrepresentable or missing data

The draft schema can express combinations that the V2 active slots cannot. Use a small, explicit conversion-error policy rather than silent submit-time omission:

- Missing local media or failed required metadata lookup should fail conversion with an identifiable reason, not turn a draft into a successful text-only restoration.
- Conflicting active media or record candidates, unsupported gallery/record kinds, and oversized image sets should be reported explicitly.
- Keep this error handling local to the adapters; do not build a new global error framework or UI in this task.
- Do not log local paths, draft contents, or other sensitive data.

## Verification

Add unit and adapter-to-store tests covering:

- Empty intent; text and mention precedence; Unicode/whitespace preservation.
- Quote with view; quote + images/video/external candidate; reply + quote/media.
- Initial text link classification across posts, feeds, lists, starter packs, external URLs, and chat invites.
- Explicit attachment precedence and impossible explicit input combinations.
- Draft post order, draft-level languages, labels, and clean draft identity.
- Legacy images, gallery images, local refs, ordering, 4/5/10-image boundaries, and overflow.
- Video MIME/dimensions, alt text, local refs, and captions.
- Tenor/Klipy GIF reconstruction and ordinary external URL fallback.
- Record collection classification without refetching supplied refs.
- Missing files/metadata, unsupported kinds, and conflicting slots.
- No mutation of source objects or leakage of shell callbacks/runtime moderation data.
- Equivalent intent and draft content produce semantically equivalent normalized inputs where both source formats can represent that content. Allow intentional draft-only identity/local-ref differences.
- Creating a store from each adapter result yields a complete first snapshot, starts only the intended simulated work, and stays clean during initial progress.

Run only repository scripts:

```sh
pnpm test src/components/ComposerV2 --watchman=false --runInBand
pnpm typecheck
pnpm lint
git diff --check
```

Use `pnpm prettier` for formatting, scoped to touched files. Its script includes `--check .`; do not append `--write` without restricting the root scan, because that would rewrite unrelated files. One established approach is a temporary ignore file at the repository root with `**/*`, `!*/`, and negated paths for the touched source files; remove that temporary file afterward.

Do not run intl extraction/compilation, modify generated lexicons, commit, stage changes, or start later todos. Keep uploads simulated. If a baseline check fails outside the task, report the exact failure without expanding scope.

## Definition of done

- Both adapters are exported and independently testable, returning `ThreadStoreInitialState`.
- Reply intents are represented faithfully without inventing thread roots or serializing runtime moderation state.
- Supported input content survives normalization, and unsupported/lossy cases are surfaced explicitly.
- Source-specific conversion logic does not leak into the thread store's actions.
- Tests and required checks pass, or any external blocker is reported precisely.
- `plans/todo.md` marks #3 completed only after verification and records the results and remaining gate/save boundaries.
- The overall architecture/implementation docs reflect the actual API and behavior.
- All work remains uncommitted for operator review.
