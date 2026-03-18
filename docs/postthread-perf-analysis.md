# PostThread Screen Performance Analysis

## Initial Render Waterfall

```
Navigation triggers PostThreadScreen mount
  │
  ├─ 1. Route params parsed (name, rkey → URI)
  │     setMinimalShellMode(false)
  │
  ├─ 2. Dependencies resolve (blocking gates before query fires)
  │     ├─ useThreadPreferences() → sort, view  [from server prefs, cached]
  │     ├─ useModerationOpts()                   [from preferences context]
  │     └─ useSession()                          [from session context]
  │
  ├─ 3. usePostThread query fires
  │     ├─ placeholderData: getThreadPlaceholder() scans cache:
  │     │   other thread queries → notifications → feeds → quotes → search → explore
  │     │   (returns cached post if found, so user sees content immediately)
  │     │
  │     └─ getPostThreadV2({anchor, sort, view, branchingFactor, below})
  │         └─ Network round-trip to AppView
  │
  ├─ 4. While network pending: Render with placeholder or skeletons
  │     ├─ If placeholder found: anchor post renders with cached data
  │     └─ If no placeholder: anchor skeleton + reply skeletons
  │
  ├─ 5. Response arrives → sortAndAnnotateThreadItems()
  │     ├─ Pass 1: Build traversal metadata (depth, siblings, moderation)
  │     ├─ Pass 2: Insert readMore/readMoreUp items, compute UI state
  │     └─ buildThread(): Combine items + composer + skeletons
  │
  ├─ 6. List renders with deferParents=true
  │     ├─ Anchor post renders first (index 0)
  │     ├─ Anchor onLayout fires → setDeferParents(false)
  │     └─ Parent posts prepend above anchor
  │         ├─ Native: maintainVisibleContentPosition keeps anchor pinned
  │         └─ Web: manual scroll offset adjustment in onContentSizeChange
  │
  └─ 7. Pagination as user scrolls
        ├─ onStartReached: load more parents (chunks of 5)
        └─ onEndReached: load more children (chunks of 50)
```

## Data Dependencies Graph

```
PostThread
├── usePostThread(anchor)
│   ├── useThreadPreferences()        ← server preferences (cached)
│   │   └── usePreferencesQuery()     ← app.bsky.actor.getPreferences
│   ├── useModerationOpts()           ← label/moderation config (context)
│   ├── useSession()                  ← auth state (context)
│   ├── useMergeThreadgateHiddenReplies() ← local + server hidden replies
│   ├── useAgent()                    ← API client (context)
│   └── useBreakpoints()              ← screen size → affects `below` param
│
├── Query: getPostThreadV2
│   ├── placeholderData → scans all query caches for cached post
│   └── enabled: prefs loaded AND anchor exists AND modOpts available
│
└── Lazy Query: getPostThreadOtherV2 (only on user action)
    └── enabled: otherItemsVisible AND hasOtherThreadItems
```

**Key observation:** The main query is gated on 3 conditions — preferences, anchor URI,
and moderation options must all be available before `getPostThreadV2` fires. If preferences
are slow to load from the server, the thread query is delayed.

## FlatList Virtualization Config

| Parameter | Value | Default | Impact |
|-----------|-------|---------|--------|
| `initialNumToRender` | Dynamic (from `useInitialNumToRender`) | 10 | Calculated from window height |
| `windowSize` | 7 | 21 | Renders 3.5 screens above/below viewport |
| `maxToRenderPerBatch` | 5 | 10 | Smaller batches = more responsive scrolling |
| `updateCellsBatchingPeriod` | 100ms | 50ms | Reduces render frequency |
| `onEndReachedThreshold` | 4 | 2 | Prefetches children early |
| `onStartReachedThreshold` | 1 | — | Loads parents when near top |

## Key Performance Patterns

### 1. Placeholder Data (eliminates blank screen)

- `getThreadPlaceholder()` searches 6 different query caches for the post
- If found in a feed or notification, the anchor post renders instantly with cached data
- Full thread data replaces placeholder when API responds

### 2. Deferred Parent Rendering (prevents scroll jump)

- On mount, `deferParents=true` — only anchor + children render
- Anchor's `onLayout` callback sets `deferParents=false`
- Parents then prepend above anchor
- Native uses `maintainVisibleContentPosition` to keep anchor stable
- Web recalculates scroll offset manually

### 3. Chunked Pagination

- Parents: 5 at a time (avoids large prepend causing jank)
- Children: 50 at a time (generous to reduce load-more triggers)

### 4. Lazy "Other Replies" Query

- Moderated/filtered replies not fetched until user taps "Show other replies"
- Avoids unnecessary network and render cost

### 5. Optimistic Reply Insertion

- `createCacheMutator` inserts new replies directly into query cache
- No refetch needed after posting a reply
- Post shadow system updates like/reply counts without re-render of entire tree

## Potential Performance Concerns

### 1. `sortAndAnnotateThreadItems` is synchronous and O(n)

- Two full passes over all thread items on every query update
- Computes moderation for every post (`moderatePost()`)
- For deeply nested threads with many replies, this could block the JS thread
- Located in `src/state/queries/usePostThread/traversal.ts`

### 2. No explicit staleTime configured

- The main query has no `staleTime` set, so TanStack Query treats data as immediately stale
- Navigating back to a previously viewed thread will refetch, though placeholder data covers the gap
- Could save unnecessary refetches by adding a staleTime (e.g., `STALE.SECONDS.FIFTEEN`)

### 3. Thread preference changes re-derive everything

- Changing sort or view triggers `prepareForParamsUpdate()` which resets `deferParents=true`
- The query key includes sort/view, so it's a fresh fetch + full re-render
- No transition animation or optimistic sorting

### 4. Parent prepend scroll management (web)

- Web path uses `onContentSizeChange` with manual scroll math
- `shouldHandleScroll` ref + `anchorTop` ref coordination is fragile
- Potential for scroll position glitches if content size changes during prepend

### 5. Multiple context providers in render path

- `PostThreadContextProvider` wraps the entire tree
- Each `ThreadItemPost` reads from thread context, session, theme, moderation, preferences
- React Compiler helps here, but deep context dependency chains can still cause cascading
  re-renders if a provider value changes

### 6. Embed loading within thread

- Each post independently loads its embeds (images, videos, link cards, quote posts)
- No coordinated prefetching of embed content
- In a thread with many image/video embeds, this creates a waterfall of media requests
- Video embeds are particularly expensive — managed by `updateActiveVideoViewAsync` on scroll

## API Parameter Tuning

| Mode | `branchingFactor` | `below` (phone) | `below` (desktop) |
|------|-------------------|------------------|--------------------|
| Linear | 1 | 10 | 10 |
| Tree | undefined (all) | 4 | 6 |

Linear view fetches deeper (10 levels) but only one branch. Tree view fetches shallower
(4-6 levels) but all branches. This is a reasonable tradeoff — tree view with unlimited
depth would be extremely expensive.

## Component Render Tree

```
PostThread (main component)
├── PostThreadContextProvider
│   ├── Layout.Header.Outer
│   │   ├── Layout.Header.BackButton
│   │   ├── Layout.Header.TitleText ("Post")
│   │   └── HeaderDropdown (sort/view controls)
│   │
│   └── List (FlatList with virtualization)
│       └── renderItem() dispatches to:
│           ├── ThreadItemAnchor (depth=0, large format)
│           │   └── PostControls (big variant), engagement stats, full embed
│           ├── ThreadItemPost (depth<0 parents, depth>0 linear replies)
│           │   └── PostControls (standard), condensed embed
│           ├── ThreadItemTreePost (depth>0, tree view)
│           │   └── Indented with vertical connection lines, compact controls
│           ├── ThreadItemPostTombstone (blocked/not-found)
│           ├── ThreadItemReadMore / ThreadItemReadMoreUp
│           ├── ThreadItemShowOtherReplies
│           ├── ThreadComposePrompt
│           └── Skeleton variants (anchor, reply, composer)
│
└── MobileComposePrompt (floating reply button on native)
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/screens/PostThread/index.tsx` | Main component, list rendering, scroll handling |
| `src/view/screens/PostThread.tsx` | Navigation screen wrapper |
| `src/state/queries/usePostThread/index.ts` | Query hook, state management |
| `src/state/queries/usePostThread/traversal.ts` | Sorting, annotation, moderation |
| `src/state/queries/usePostThread/queryCache.ts` | Optimistic cache mutation |
| `src/state/queries/usePostThread/const.ts` | API params (branching factor, below) |
| `src/screens/PostThread/const.ts` | UI constants (spacing, widths) |
| `src/screens/PostThread/components/*.tsx` | Individual item renderers |

## Summary

The PostThread screen is well-optimized for the common case. The placeholder data system,
deferred parent rendering, and chunked pagination create a smooth experience for typical
threads. The main areas where performance could degrade are:

1. **Very large threads** where `sortAndAnnotateThreadItems` becomes expensive on the JS thread
2. **Media-heavy threads** where embed loading creates waterfalls of network requests
3. **Lack of staleTime** causing unnecessary refetches on re-navigation
4. **Web scroll management** during parent prepending being fragile
