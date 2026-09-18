# Composer V2 architecture

## Summary

Composer V2 is a per-composer domain store with React as a thin view layer. It replaces the current pattern where UI, uploads, drafts, and submission logic are tightly coupled inside a large component.

```text
ComposerOpts -----------------> composerOptsToInitialState() --+
                                                             |
Saved draft + loaded media ---> draftToInitialState() --------+
                                                             |
                                                             v
                                                  ThreadStoreInitialState
                                                             |
                                                             v
+------------------------------------------------------------+
| ThreadStore                                                |
|                                                            |
| Serializable post data                                     |
| Actions and invariants                                     |
| Async task coordination                                    |
+------------------------------+-----------------------------+
                               | subscriptions
                               v
                        React hooks and UI

ThreadStore ---> draft codec ---> saved draft
ThreadStore ---> submit planner ---> validated/logged writes
                                  later: applyWrites
```

## 1. One store per composer session

`createThreadStore()` creates an isolated store for one open composer. It is not global application state and does not depend on React.

The store exposes:

```ts
{
  getState()
  subscribe(listener)
  actions
  destroy()
}
```

This provides:

- Deterministic unit testing without rendering anything.
- Explicit cleanup when the composer closes.
- No Context-wide cascade for every keystroke.
- A place to enforce protocol and product invariants independently of UI.

The implementation lives in `src/components/ComposerV2/store/index.ts`.

The earlier parallel implementation under `ComposerV2/lib` has been removed, leaving one store implementation.

## 2. The thread is the aggregate root

The top-level state is currently:

```ts
type ThreadState = {
  posts: Record<string, ThreadPost>
  replyTo: ThreadReplyTarget | undefined
  draftId: string | undefined
  isDirty: boolean
}
```

Each post has a stable nanoid. Object insertion order is currently used as thread order.

This lets async work address a post by identity rather than array index. Adding, removing, or reordering posts does not need to change which post owns a media upload or link-resolution task.

Each `ThreadPost` now owns text, languages, labels, and two protocol-aligned attachment slots:

```ts
{
  text
  langs
  labels

  attachments: {
    record: RecordAttachment | undefined
    media: MediaAttachment | undefined
  }

  imageSelectionsRemaining
  videoSelectionsRemaining
  gifSelectionsRemaining
}
```

A future `suggestedExternal` field could retain dormant UI suggestions separately from publishable attachments. It is not implemented by the attachment migration. For now settled attachments block incoming URI candidates, pending/failed URI candidates can be superseded, and explicit record setters replace the record.

The planned state also expands the thread aggregate with:

- Reply target.
- Thread-wide postgate settings.
- Threadgate settings.
- Submission and validation state.
- Draft media bookkeeping.
- Explicit hydration metadata.

Focus, open dialogs, and callbacks such as `onPost` remain outside persisted domain state.

## 3. Attachments are one record slot plus one media slot

A post has exactly one top-level lexicon embed. The valid protocol shapes are a record, media, or `recordWithMedia`, so V2 models publishable attachments as two orthogonal slots:

```ts
type PostAttachments = {
  record?: RecordAttachment
  media?: MediaAttachment
}
```

### Record attachment

The record slot contains at most one strong-ref-backed record:

- Quoted post.
- Custom feed.
- List.
- Starter pack.
- Another supported record embed.

A quote is a post-kind record attachment. It does not require a structurally separate quote slot.

Two records cannot coexist because `app.bsky.embed.recordWithMedia` accepts one record and one media attachment, not two records.

### Media attachment

The media slot contains at most one media embed:

- Images.
- Gallery.
- Video.
- External card.

GIFs and chat invites are encoded as external cards, so they occupy the media slot despite being presented differently in the UI.

An images/gallery attachment contains multiple image items but remains one media attachment. The target image behavior is:

- One to four images produce `app.bsky.embed.images`.
- Five to 10 images produce `app.bsky.embed.gallery`.
- One video is allowed.
- One external card or GIF is allowed.
- Different media attachment kinds are never mixed.

### Valid combinations

| Record slot | Media slot | Submitted embed                  |
| ----------- | ---------- | -------------------------------- |
| Empty       | Empty      | No embed                         |
| Set         | Empty      | `app.bsky.embed.record`          |
| Empty       | Set        | The active media embed           |
| Set         | Set        | `app.bsky.embed.recordWithMedia` |

The store prevents two active records and two active media attachments. Record construction derives the final lexicon variant from the slots instead of using submit-time priority to discard conflicting state.

A detected external-card suggestion may be retained separately as `suggestedExternal`. It becomes publishable only when promoted into the media slot; selected images or video can temporarily displace it without destroying the suggestion.

## 4. Async state is represented explicitly

Uploads and URI resolution are state machines rather than loose component booleans.

An upload moves through:

```text
pending
   |
   v
uploading(progress)
   |            \
   v             v
uploaded(blob)  failed(error, retry)
```

Link resolution similarly has pending, resolved, and failed variants.

The UI renders the current domain state instead of coordinating multiple effects to infer what is happening.

Retry functions are currently attached directly to failed states for UI convenience. Because functions are not serializable, draft hydration will formalize the boundary:

- Persisted data contains stable status and error information.
- Runtime hydration reattaches retry behavior.
- Task handles and abort controllers always remain outside serialized state.

## 5. Runtime tasks live beside state

The store owns non-serializable runtime sidecars:

```ts
uploadTasks: Map<mediaId, UploadTask>
resolutionRevs.record
resolutionRevs.media
```

Uploads are keyed by stable media ID. Removing media or destroying the composer cancels its task.

Link resolution uses revision counters:

1. Start resolving a URI and increment that post slot's revision.
2. Capture the revision in the promise callback.
3. If another URI replaces it, or the user removes the embed, the revision changes.
4. The stale callback sees that it is no longer current and does nothing.

Record and media resolution have separate revision domains. Removing an external card therefore does not cancel an unrelated quoted-post resolution, even though the quote is now modeled as a post-kind record attachment.

The same pattern should govern real compression, image upload, multipart video jobs, and submission planning.

## 6. Actions are the invariant boundary

UI components do not directly replace post objects. They invoke store actions such as:

```ts
setPostText()
addPost()
removePost()
addMedia()
removeMedia()
addUri()
setRecordAttachment()
removeRecordAttachment()
removeMediaAttachment()
```

Actions perform:

- Conflict checks.
- Task cancellation.
- Dirty-state changes.
- Derived-state recomputation.
- Stale async result invalidation.

For example, `setPostMedia()` is the chokepoint that also recalculates picker capacity. This prevents the media array and selection counters from disagreeing.

No-op actions preserve the current state reference and do not notify subscribers.

## 7. Lex clients are injected dependencies

The store receives the network capabilities required for link resolution:

```ts
createThreadStore({
  resolvers: {
    appviewClient,
    chatClient,
  },
})
```

It does not create a global agent internally.

As real uploads are implemented, the dependency boundary will expand to include:

- PDS client.
- Appview client.
- Chat client.
- Account dispatch URL for video service authentication.
- Potentially injected media operations for deterministic tests.

The store remains testable because tests can inject fake clients, resolvers, and workers rather than mocking global session state.

## 8. React is an adapter over the store

`ThreadStoreProvider` only distributes an already-created store.

There are two subscription levels:

- `useThreadState()` subscribes to the whole thread.
- `useThreadPost(postId)` subscribes to one post object.

This allows the thread list to respond to ordering changes while an individual composer row avoids rerendering when another post's upload progresses.

The debug screen demonstrates the integration in `src/view/screens/DebugComposer/DebugComposer.tsx`.

The text input is intentionally uncontrolled:

- `defaultValue` hydrates it once.
- The native input owns its text while typing.
- Each change is mirrored into the store.

This avoids turning every native text event into a controlled-input round trip.

## 9. Rich text is derived

The store keeps plain text rather than a `RichText` class instance.

`useThreadPostRichText()` derives:

- A `RichText` instance.
- Detected facets.
- Shortened grapheme length.

This keeps core state closer to serializable data and avoids recomputing rich text when unrelated state, such as upload progress or alt text, changes.

The final submission planner performs authoritative facet resolution and text normalization. The hook provides responsive preview and character-count validity.

## 10. Hydration converges on one input interface

Open-composer intents and saved drafts are different source formats, but they are not separate store initialization paths. Both adapters produce the same normalized input interface before `createThreadStore()` runs.

```text
ComposerOpts -----------------> composerOptsToInitialState() --+
                                                             |
Saved draft + loaded media ---> draftToInitialState() --------+--> ThreadStoreInitialState
```

`ThreadStoreInitialState` is implemented in `src/components/ComposerV2/store/types.ts`. It is plain source-independent data describing:

- Ordered posts.
- Text, languages, and labels.
- One record attachment and one media attachment per post.
- Local image/video sources, local draft refs, alt text, and caption contents.
- GIF metadata and resolved external/chat-invite cards.
- Draft identity and initial dirty/saved state.
- A minimal serializable reply target: parent URI/CID, text, languages, author,
  and a moderation-free embed preview. The root is intentionally unresolved.

The adapters are implemented in `src/components/ComposerV2/adapters/`. They do
not add gate state, draft serialization, or shell UI intents to this contract.

```ts
createThreadStore({
  resolvers: {appviewClient, chatClient},
  initialState: {
    draftId: 'saved-draft-id',
    posts: [
      {
        text: 'Initial text',
        attachments: {
          record: {kind: 'uri', uri: postUrl},
          media: {
            kind: 'images',
            items: [{uri: localImageUri, width: 1200, height: 800}],
          },
        },
      },
    ],
  },
})
```

Omitted or empty `posts` produce one empty post. Attachment inputs either provide known values (for example `{kind: 'post', record, view}`) or a `{kind: 'uri', uri}` candidate in the chosen slot. Initial URI candidates reserve that slot immediately; known attachments are not refetched. Initial image sets over 10 are rejected before starting work rather than silently truncating normalized data.

It does not contain:

- Upload handles or abort controllers.
- Retry closures.
- Async revision counters.
- React state.
- Shell callbacks such as `onPost` or `onPostSuccess`.

The store constructor performs the single transformation from `ThreadStoreInitialState` into live `ThreadState`. Pure builders generate fresh post/item IDs, copy editable input fields, and compute capacities before any background work starts. The constructor then starts simulated uploads and pending URI resolution. Initialization, background progress, and retries leave the draft clean unless `isDirty: true` was explicitly supplied. Supplied views and GIF metadata are treated as immutable; the store does not modify them.

### `ComposerOpts` adapter

The public shell contract remains compatible during migration. The async
`composerOptsToInitialState(opts, metadataOptions?)` translates existing intents
without requiring callers to understand the V2 store shape. It preserves text
and mention precedence, detects at most one record and one media URI from
initial facets, and gives explicit quote/images/video inputs precedence over
those candidates. Video MIME type comes from the existing platform metadata
probe, which is injectable for deterministic tests.

Supplied quotes are passed through as resolved post records and local media is
passed as source data. `openGallery`, `onPost`, `onPostSuccess`, `logContext`,
close behavior, and blocking/auth checks remain shell concerns. The adapter does
not return them or initialize them in the store.

### Draft adapter

The async `draftToInitialState({draftId, draft, loadedMedia, ...metadata})`
performs draft-specific decoding and local media lookup, then returns the same
`ThreadStoreInitialState` interface. It reads legacy images before gallery
images, preserves local refs, probes image/video metadata, restores captions,
reconstructs Tenor/Klipy GIF data, and classifies ordinary external URLs by
record/media slot. Known record refs are classified from their AT-URI
collection and are not refetched.

Missing local media, failed metadata, unsupported entries/record kinds,
conflicting active attachments, and image overflow throw
`ComposerAdapterError` with a stable `code`; they are not silently reduced to
text-only state. Neither source mounts an empty store or dispatches corrective
actions. The store constructor starts only its existing simulated uploads and
URI resolution after the complete snapshot is built.

## 11. Drafts are a codec around the store

Draft persistence is a bidirectional boundary:

```text
ThreadState <--> app.bsky.draft.defs.Draft
```

Serialization strips runtime concerns and preserves:

- Posts and ordering.
- Text, labels, and gate settings.
- Media local references.
- Quotes and external embeds.
- Captions and alt text.
- Draft identity.

Hydration supports both legacy `embedImages` drafts and current `embedGallery` drafts.

Local media remains the durable draft source. Completed blobs and multipart job state do not replace the local file needed to reopen and edit a draft.

Hydrated media begins processing and uploading eagerly. A valid upload from the same live session may be reused, but persisted drafts must not depend on ephemeral upload state.

## 12. Real media processing is eager

Selecting or hydrating media begins processing immediately.

### Images

```text
local source
    |
    v
compress and resize
    |
    v
upload through PDS
    |
    v
BlobRef stored on media item
```

The implementation should reuse the existing post image compression configuration and blob-upload helper.

### Video

```text
local source
    |
    v
validate and compress
    |
    v
multipart upload
    |
    v
finish and poll job
    |
    v
completed video BlobRef
```

The existing multipart implementation already supports:

- Byte progress.
- Missing-part recovery.
- Token refresh.
- Retryable failures.
- Cancellation and remote abort cleanup.

The store should expose compression and network progress distinctly while preserving one race-safe task lifecycle for each video.

## 13. Postgates and threadgates are thread-level settings

The composer exposes one shared postgate configuration for the thread rather than independently editable settings on every post.

During submission planning:

- If the shared postgate configuration requires records, emit a matching postgate for every post using that post's URI and record key.
- Emit a threadgate only for the root post.
- Gate records use the same record key as their associated post.

This keeps the UI and store model simple while producing the protocol's per-post records where necessary.

## 14. Reordering is a domain capability

The store will support moving an existing post without changing its identity or recreating its content.

A reorder operation must preserve:

- Post ID.
- Text and embeds.
- Media IDs.
- In-flight upload ownership.
- Link-resolution task ownership.

The submission planner and tests will honor the resulting order. The debug harness will expose the capability, but production reordering UI is deferred.

## 15. Submission is split into planning and execution

The first submission implementation performs real media uploads but does not mutate the repository.

```text
Store snapshot
   |
   +-- wait for eager uploads
   +-- resolve facets
   +-- normalize text
   +-- allocate TIDs and rkeys
   +-- build post records
   +-- compute CIDs
   +-- chain reply refs
   +-- build threadgates and postgates
   +-- build applyWrites input
   +-- validate with generated lexicons
   +-- safely log the plan
```

No `applyWrites` request is made in this milestone.

The planner produces the final validated writes, so enabling publication later should be a narrow final step:

```ts
await pdsClient.call(com.atproto.repo.applyWrites, validatedInput)
```

## Current implementation status

Implemented:

- External thread store and React subscriptions.
- Stable thread/post identity.
- Text, language, and label mutations.
- Media invariants.
- Simulated uploads with cancellation and retry.
- URI resolution and stale-result suppression.
- Unified record/media attachment slots, including quotes as post-kind records.
- Slot-local retries, cancellation, and snapshot isolation.
- Grapheme derivation.
- Debug harness.
- Current lex-client adaptation.
- `ThreadStoreInitialState`, direct initial snapshot construction, and eager simulated uploads/URI resolution.
- `ComposerOpts` and draft adapters, including serializable reply previews and
  explicit conversion errors.

Still to implement:

- Expanded composer-session state beyond the reply preview.
- Postgates and threadgates.
- Gallery limits and embed selection.
- Draft codec.
- Real image processing and uploads.
- Real video processing and multipart uploads.
- Post reordering action.
- Submission planner.
- Production UI migration.

The detailed implementation plan is in `plans/composer-v2.md`.
