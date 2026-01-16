# Plan: Migrate Drafts from Local Storage to Remote API

## Overview

Replace the local-only draft storage with the new `agent.app.bsky.draft.*` server API. The server API provides `getDrafts`, `createDraft`, `updateDraft`, and `deleteDraft` endpoints.

## Key Decisions (Confirmed)

1. **Server-only storage** - No hybrid/offline support for now
2. **Media via localRef** - Images and compressed videos stored locally, referenced by filepath in `localRef`. When fetching drafts, check if local file exists. If missing (different device), show a note in the list and ignore that media when editing.
3. **No reply drafts** - Hide the drafts button entirely when replying
4. **GIFs as external embeds** - Store URL with dimensions in `DraftEmbedExternal`, rehydrate from URL pattern (like feed embeds). No local file needed.
5. **Video compression flow unchanged** - Video compresses immediately, then save compressed file locally and reference via localRef

---

## Phase 1: Update Schema & Types

### 1.1 Create type converters (`src/state/drafts/api.ts`)

Map between local `StoredDraft` types and server `Draft` types:

```typescript
// Server types from @atproto/api
import {
  AppBskyDraftDefs,
  AppBskyDraftCreateDraft,
  AppBskyDraftUpdateDraft,
} from '@atproto/api'

// Convert ComposerState → server Draft
function composerStateToDraft(state: ComposerState, replyTo?: ReplyTo): AppBskyDraftDefs.Draft

// Convert server DraftView → local display format
function draftViewToSummary(view: AppBskyDraftDefs.DraftView): DraftSummary

// Convert server Draft → ComposerState for restoration
function draftToComposerState(draft: AppBskyDraftDefs.Draft): Partial<ComposerState>
```

### 1.2 Update schema.ts

- Remove `syncStatus` and `serverDraftId` (no longer needed)
- Keep `DraftSummary` and `DraftPostDisplay` for UI (derived from server response)
- Remove `StoredDraft` and `StoredPostDraft` (replaced by server types)

---

## Phase 2: Implement Server API Hooks

### 2.1 Replace hooks in `src/state/drafts/hooks.ts`

**`useDrafts()` → Server getDrafts**
```typescript
export function useDrafts() {
  const agent = useAgent()

  return useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const res = await agent.app.bsky.draft.getDrafts({})
      return res.data.drafts.map(draftViewToSummary)
    },
    staleTime: STALE.SECONDS.THIRTY,
  })
}
```

**`useSaveDraft()` → Server createDraft / updateDraft**
```typescript
export function useSaveDraft() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ composerState, replyTo, existingDraftId }) => {
      const draft = composerStateToDraft(composerState, replyTo)

      if (existingDraftId) {
        await agent.app.bsky.draft.updateDraft({
          draft: { id: existingDraftId, draft }
        })
        return existingDraftId
      } else {
        const res = await agent.app.bsky.draft.createDraft({ draft })
        return res.data.id
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
    },
  })
}
```

**`useDeleteDraft()` → Server deleteDraft**
```typescript
export function useDeleteDraft() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (draftId: string) => {
      await agent.app.bsky.draft.deleteDraft({ id: draftId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
    },
  })
}
```

**`useLoadDraft()` → Extract from getDrafts response**
```typescript
// Option A: Fetch single draft from cached list
// Option B: If API adds getDraft(id), use that
```

### 2.2 Handle `DraftLimitReachedError`

Add error handling in save mutation:
```typescript
onError: (error) => {
  if (error instanceof AppBskyDraftCreateDraft.DraftLimitReachedError) {
    // Show toast: "Draft limit reached. Delete some drafts to save new ones."
  }
}
```

---

## Phase 3: Media Handling Strategy

### 3.1 LocalRef Pattern

Media files (images, compressed videos) are stored locally on device. The server draft stores a `localRef.path` that uniquely identifies the local file.

### 3.2 Implementation approach

**For images:**
```typescript
// When saving draft:
// 1. Copy image to drafts media directory (existing pattern)
// 2. Store the local path in DraftEmbedImage.localRef.path

// When loading draft:
// 1. Check if file exists at localRef.path
// 2. If exists: use it
// 3. If missing: mark draft as having unavailable media (different device)
```

**For videos:**
```typescript
// When saving draft:
// 1. Video compresses as normal (existing flow)
// 2. Save compressed video to drafts media directory
// 3. Store path in DraftEmbedVideo.localRef.path

// When loading: same as images - check existence
```

**For GIFs:**
```typescript
// Store as DraftEmbedExternal with Tenor URL + dimensions in query params
// URL format: https://media.tenor.com/.../AAAAC/...gif?hh=HEIGHT&ww=WIDTH
// No local file needed - rehydrate from URL like feed embeds do
```

### 3.3 "Different Device" handling

When fetching drafts list:
- For each draft, check if all localRef paths exist locally
- If any missing, mark draft with `hasMissingMedia: true`
- UI shows a note: "Some media unavailable (saved on another device)"
- When restoring such a draft, skip the missing media

---

## Phase 4: Update Composer Integration

### 4.1 Modify `restore_from_draft` action

Update to accept server `Draft` type instead of `StoredDraft`:
```typescript
case 'restore_from_draft': {
  const { draft } = action  // Now AppBskyDraftDefs.Draft

  const posts = draft.posts.map(serverPost => {
    // Convert DraftPost → PostDraft
    // Handle embedImages, embedVideos, embedExternals, embedRecords
  })

  return { ...state, thread: { posts, ... }, isDirty: false }
}
```

### 4.2 Update `mark_saved` action

Now receives server-generated draft ID (TID format).

---

## Phase 5: Remove Local Storage

### 5.1 Delete files
- `src/state/drafts/storage.ts` (native file storage)
- `src/state/drafts/storage.web.ts` (IndexedDB storage)

### 5.2 Migration cleanup
- Remove `loadedMediaMap` from composer state (media now server-managed)
- Remove `pathToLocalId` reverse mapping logic
- Remove media cleanup/reuse detection code

### 5.3 Update exports in `src/state/drafts/index.ts`

---

## Phase 6: Update UI Components

### 6.1 `DraftItem.tsx`

- Update to use server media URLs directly
- Remove local media loading logic (`storage.loadMediaFromLocal`)
- Images/videos come with blob URLs from server

### 6.2 `DraftsListDialog.tsx`

- Handle pagination with `cursor` from getDrafts
- Add "Load more" or infinite scroll

### 6.3 `DraftsButton.tsx`

- No changes needed (already uses hooks abstraction)

---

## Phase 7: Error Handling & Edge Cases

### 7.1 Network errors
- Show toast on save failure
- Retry logic for transient failures
- Consider optimistic updates with rollback

### 7.2 Draft limit reached
- Surface `DraftLimitReachedError` to user
- Suggest deleting old drafts

### 7.3 Deleted drafts
- Handle case where draft was deleted on another device
- Graceful handling in restore flow

---

## Phase 8: Testing

### 8.1 Update unit tests
- `src/state/drafts/__tests__/serialization.test.ts`
- Test type converters (composerStateToDraft, draftViewToSummary)
- Mock server API responses

### 8.2 Manual testing checklist
- [ ] Create new draft
- [ ] Edit existing draft
- [ ] Delete draft
- [ ] Draft with images
- [ ] Draft with video
- [ ] Draft with GIF
- [ ] Draft with quote post
- [ ] Draft with external link
- [ ] Thread draft (multiple posts)
- [ ] Reply draft
- [ ] Draft limit error handling
- [ ] Cross-device sync verification

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/state/drafts/schema.ts` | Simplify types, remove storage-specific fields |
| `src/state/drafts/hooks.ts` | Replace with server API calls |
| `src/state/drafts/api.ts` | **NEW** - Type converters |
| `src/state/drafts/index.ts` | Update exports |
| `src/state/drafts/storage.ts` | **DELETE** |
| `src/state/drafts/storage.web.ts` | **DELETE** |
| `src/view/com/composer/state/composer.ts` | Update restore_from_draft action |
| `src/view/com/composer/drafts/DraftItem.tsx` | Use server media URLs |
| `src/view/com/composer/drafts/DraftsListDialog.tsx` | Add pagination |
| `src/state/queries/drafts.ts` | **DELETE** (was placeholder) |

---

## Resolved Questions

1. **Media handling**: Use localRef with local filepath. Keep media on device, server stores the path reference. Check file existence when loading - show "different device" note if missing.

2. **Reply drafts**: Not supported. Hide drafts button when replying.

3. **GIF handling**: Store as `DraftEmbedExternal` with Tenor URL including dimensions in query params (`?hh=HEIGHT&ww=WIDTH`). Rehydrate from URL pattern like feed embeds.

4. **Offline support**: Server-only for now. No offline queuing.

---

## Estimated Scope

- **Phase 1-2**: Core API integration (~2-3 files, straightforward)
- **Phase 3**: Media handling (most complex, depends on API behavior)
- **Phase 4-6**: Composer & UI updates (moderate)
- **Phase 7-8**: Polish & testing

The media handling (Phase 3) is the biggest unknown and may require experimentation with the API to understand the exact flow.
