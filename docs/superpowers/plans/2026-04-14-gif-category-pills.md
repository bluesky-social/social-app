# GIF Category Pills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a horizontal scrollable row of category pills (Trending, Love, Happy, Sad, etc.) to the GIF picker's idle screen so users can browse GIFs by emotion/reaction without typing.

**Architecture:** A new `GifCategoryPills` component renders a horizontal `ScrollView` of `Pressable` pills. `GifPickerDialog` manages `activeCategory` state — when a non-trending pill is tapped, its searchterm is passed to the existing `useGifPickerData` hook. Pills hide when the user types and reappear when the input is cleared.

**Tech Stack:** React Native, TypeScript, ALF design system, Lingui (i18n)

**Spec:** `docs/superpowers/specs/2026-04-14-gif-category-pills-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/gifPicker/components/GifCategoryPills.tsx` | Create | Horizontal scrollable pill row with active state |
| `src/features/gifPicker/GifPickerDialog.tsx` | Modify | Add category state, render pills, connect to search |

---

### Task 1: Create `GifCategoryPills` Component

**Files:**
- Create: `src/features/gifPicker/components/GifCategoryPills.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/gifPicker/components/GifCategoryPills.tsx`:

```tsx
import {ScrollView, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export type GifCategory = {
  id: string
  emoji: string
  label: ReturnType<typeof msg>
  searchterm: string | null // null = trending (uses featured endpoint)
}

export const GIF_CATEGORIES: readonly GifCategory[] = [
  {id: 'trending', emoji: '🔥', label: msg`Trending`, searchterm: null},
  {id: 'love', emoji: '❤️', label: msg`Love`, searchterm: 'love'},
  {id: 'happy', emoji: '😄', label: msg`Happy`, searchterm: 'happy'},
  {id: 'sad', emoji: '😢', label: msg`Sad`, searchterm: 'cry'},
  {id: 'party', emoji: '🎉', label: msg`Party`, searchterm: 'congratulations'},
  {id: 'yes', emoji: '👍', label: msg`Yes`, searchterm: 'yes'},
  {id: 'lol', emoji: '😂', label: msg`LOL`, searchterm: 'lol'},
  {id: 'excited', emoji: '🤩', label: msg`Excited`, searchterm: 'excited'},
] as const

export function GifCategoryPills({
  activeId,
  onSelect,
}: {
  activeId: string
  onSelect: (category: GifCategory) => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <View style={[a.mb_sm]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[a.flex_row, a.gap_xs, a.px_xl]}>
        {GIF_CATEGORIES.map(category => {
          const isActive = category.id === activeId
          return (
            <Button
              key={category.id}
              label={_(category.label)}
              onPress={() => onSelect(category)}
              size="small"
              variant={isActive ? 'solid' : 'outline'}
              color={isActive ? 'primary' : 'secondary'}
              shape="default">
              <ButtonText>
                <Text emoji>{category.emoji}</Text> {_(category.label)}
              </ButtonText>
            </Button>
          )
        })}
      </ScrollView>
    </View>
  )
}
```

Notes on the implementation:
- Uses the existing `Button` component with `variant="solid"` for active and `variant="outline"` for inactive, matching ALF patterns
- `shape="default"` gives pill-shaped buttons (the default shape is a pill/rounded)
- `ScrollView` with `horizontal` and `showsHorizontalScrollIndicator={false}`
- `px_xl` padding matches the GIF grid's `contentContainerStyle` on native
- The `GIF_CATEGORIES` array and `GifCategory` type are exported so `GifPickerDialog` can reference them
- `searchterm: null` for trending means "use the featured endpoint" — handled by the consumer
- Emoji is wrapped in `<Text emoji>` per codebase convention for emoji rendering

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/features/gifPicker/components/GifCategoryPills.tsx
git commit -m "feat(gif): add GifCategoryPills component"
```

---

### Task 2: Wire Category Pills into `GifPickerDialog`

**Files:**
- Modify: `src/features/gifPicker/GifPickerDialog.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/features/gifPicker/GifPickerDialog.tsx`, add after the existing imports:

```ts
import {
  GIF_CATEGORIES,
  GifCategoryPills,
  type GifCategory,
} from '#/features/gifPicker/components/GifCategoryPills'
```

- [ ] **Step 2: Replace `GifPickerBody`**

Replace the entire `GifPickerBody` function (lines 56-140) with:

```tsx
function GifPickerBody({
  control,
  onSelectGif,
}: {
  control: Dialog.DialogControlProps
  onSelectGif: (gif: Gif) => void
}) {
  const {gtMobile} = useBreakpoints()
  const textInputRef = useRef<TextInput>(null)
  const listRef = useRef<ListMethods>(null)
  const [rawSearch, setRawSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('trending')
  const search = useThrottledValue(rawSearch, 750)

  // Determine the effective search query:
  // - If user is typing, use the typed text
  // - If a non-trending category is active, use its searchterm
  // - Otherwise (trending), empty string triggers the featured endpoint
  const activeCategorySearchterm =
    GIF_CATEGORIES.find(c => c.id === activeCategory)?.searchterm ?? ''
  const effectiveSearch = search.length > 0 ? search : activeCategorySearchterm

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    error,
    isPending,
    isError,
    isSearching,
    refetch,
  } = useGifPickerData(effectiveSearch)

  const items = data?.pages.flatMap(page => page.results) ?? []
  const hasData = items.length > 0

  const onEndReached = () => {
    if (isFetchingNextPage || !hasNextPage || error) return
    void fetchNextPage()
  }

  const onGoBack = () => {
    if (isSearching) {
      textInputRef.current?.clear()
      setRawSearch('')
      setActiveCategory('trending')
    } else {
      control.close()
    }
  }

  const onChangeSearch = (text: string) => {
    setRawSearch(text)
    listRef.current?.scrollToOffset({offset: 0, animated: false})
  }

  const onSelectCategory = (category: GifCategory) => {
    setActiveCategory(category.id)
    listRef.current?.scrollToOffset({offset: 0, animated: false})
  }

  const showPills = rawSearch.length === 0

  const header = (
    <>
      <GifPickerHeader
        inputRef={textInputRef}
        onChangeText={onChangeSearch}
        onClose={() => control.close()}
        onEscape={() => control.close()}
      />
      {showPills && (
        <GifCategoryPills
          activeId={activeCategory}
          onSelect={onSelectCategory}
        />
      )}
      {!hasData && (
        <GifPickerPlaceholder
          isLoading={isPending}
          isError={isError}
          isSearching={isSearching}
          query={effectiveSearch}
          onRetry={refetch}
          onGoBack={onGoBack}
        />
      )}
    </>
  )

  return (
    <>
      {gtMobile && <Dialog.Close />}
      <GifPickerGrid
        ref={listRef}
        items={items}
        header={header}
        hasData={hasData}
        isFetchingNextPage={isFetchingNextPage}
        error={error}
        fetchNextPage={fetchNextPage}
        onEndReached={onEndReached}
        onSelectGif={onSelectGif}
      />
    </>
  )
}
```

Key changes from the current version:
- Added `activeCategory` state (defaults to `'trending'`)
- Added `effectiveSearch` that resolves the search query from either typed text or the active category's searchterm
- Added `onSelectCategory` handler
- Added `showPills` flag — `true` when `rawSearch` is empty
- Render `GifCategoryPills` between the header and placeholder, conditionally on `showPills`
- `onGoBack` now also resets `activeCategory` to `'trending'`
- `GifPickerPlaceholder` receives `effectiveSearch` instead of `search` so error messages reflect the actual query

- [ ] **Step 3: Verify typecheck passes**

Run: `yarn typecheck`
Expected: No new errors

- [ ] **Step 4: Verify lint passes**

Run: `yarn lint`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add src/features/gifPicker/GifPickerDialog.tsx
git commit -m "feat(gif): wire category pills into GIF picker dialog"
```

---

### Task 3: Manual Testing

- [ ] **Step 1: Test on web (CORS-disabled Chrome) or iOS simulator**

1. Open the composer and click the GIF button
2. Verify the pill row appears below the search input with "Trending" highlighted
3. Verify featured GIFs load in the grid below

- [ ] **Step 2: Test category selection**

1. Tap "Happy" — verify the pill highlights, grid shows happy GIFs
2. Tap "Sad" — verify it switches, grid shows sad GIFs
3. Tap "Trending" — verify it goes back to featured GIFs
4. Tap several pills quickly — verify no visual glitches

- [ ] **Step 3: Test interaction with search**

1. Start typing in the search box — verify pills hide
2. Clear the search box — verify pills reappear with "Trending" active
3. Select a category, then type — verify pills hide and search results show
4. Clear again — verify pills return with "Trending" (not the previously selected category)

- [ ] **Step 4: Test pill scrolling**

1. On a narrow screen (mobile or narrow browser), verify the pill row scrolls horizontally
2. Verify all 8 pills are reachable by scrolling
3. Verify no horizontal scroll indicator is visible

- [ ] **Step 5: Commit any fixes from testing**

```bash
git add -A
git commit -m "fix(gif): address issues found during category pills testing"
```
