# GIF Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline autocomplete suggestions to the GIF picker dialog using Klipy's `/v2/autocomplete` endpoint, so users see search term completions as they type.

**Architecture:** A new `useKlipyAutocompleteQuery` hook fetches string suggestions from Klipy with a 200ms throttle. A `useGifAutocomplete` orchestration hook manages visibility and keyboard state. `GifAutocompleteSuggestions` renders an inline list below the search input inside `GifPickerHeader`, with ARIA attributes and web keyboard navigation.

**Tech Stack:** React Native, TypeScript, TanStack Query, Lingui (i18n), ALF design system

**Spec:** `docs/superpowers/specs/2026-04-14-gif-autocomplete-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/constants.ts` | Modify | Add `GIF_KLIPY_AUTOCOMPLETE` endpoint constant |
| `src/state/queries/klipy.ts` | Modify | Add `fetchKlipyAutocomplete` function and `useKlipyAutocompleteQuery` hook |
| `src/features/gifPicker/hooks/useGifAutocomplete.ts` | Create | Orchestration hook: 200ms throttle, visibility flag, keyboard nav state |
| `src/features/gifPicker/components/GifAutocompleteSuggestions.tsx` | Create | Inline suggestion list UI with ARIA and keyboard highlight |
| `src/features/gifPicker/components/GifPickerHeader.tsx` | Modify | Render `GifAutocompleteSuggestions` below search input, wire keyboard events |
| `src/features/gifPicker/GifPickerDialog.tsx` | Modify | Wire `useGifAutocomplete` into `GifPickerBody`, connect to search state |

---

### Task 1: Add Klipy Autocomplete Endpoint Constant

**Files:**
- Modify: `src/lib/constants.ts:181-184`

- [ ] **Step 1: Add the endpoint constant**

In `src/lib/constants.ts`, add the autocomplete URL builder after the existing `GIF_KLIPY_FEATURED` constant (after line 184):

```ts
export const GIF_KLIPY_AUTOCOMPLETE = (params: string) =>
  `${GIF_SERVICE}/klipy/v2/autocomplete?${params}`
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat(gif): add GIF_KLIPY_AUTOCOMPLETE endpoint constant"
```

---

### Task 2: Add `useKlipyAutocompleteQuery` Hook

**Files:**
- Modify: `src/state/queries/klipy.ts`

- [ ] **Step 1: Add imports and query key**

At the top of `src/state/queries/klipy.ts`, update the imports:

Change:
```ts
import {keepPreviousData, useInfiniteQuery} from '@tanstack/react-query'

import {GIF_KLIPY_FEATURED, GIF_KLIPY_SEARCH} from '#/lib/constants'
```

To:
```ts
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import {
  GIF_KLIPY_AUTOCOMPLETE,
  GIF_KLIPY_FEATURED,
  GIF_KLIPY_SEARCH,
} from '#/lib/constants'
import {STALE} from '#/state/queries'
```

After the existing `RQKEY_SEARCH` line (line 11), add:

```ts
export const RQKEY_AUTOCOMPLETE = (query: string) => [
  RQKEY_ROOT,
  'autocomplete',
  query,
]
```

- [ ] **Step 2: Add the fetch function**

After line 14 (`const searchGifs = ...`), add the autocomplete fetcher. This is a standalone function (not using `createKlipyApi`) because the autocomplete endpoint has a different response shape (string array, not GIF objects) and different parameters (limit=8, no contentfilter):

```ts
async function fetchKlipyAutocomplete(query: string): Promise<string[]> {
  const params = new URLSearchParams()

  params.set(
    'client_key',
    Platform.select({
      ios: 'bluesky-ios',
      android: 'bluesky-android',
      default: 'bluesky-web',
    }),
  )

  params.set('limit', '8')

  const locale = getLocales?.()?.[0]
  if (locale) {
    params.set('locale', locale.languageTag.replace('-', '_'))
  }

  params.set('q', query)

  const res = await fetch(GIF_KLIPY_AUTOCOMPLETE(params.toString()), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch KLIPY autocomplete API')
  }
  const body: KlipyAutocompleteResponse = await res.json()
  return body.results
}
```

- [ ] **Step 3: Add the response type**

At the bottom of the file, after the existing `KlipyResponse` type (after line 177), add:

```ts
type KlipyAutocompleteResponse = {
  locale: string
  results: string[]
}
```

- [ ] **Step 4: Add the query hook**

After the existing `useGifSearchQuery` function (after line 38), add:

```ts
export function useKlipyAutocompleteQuery(
  query: string,
  options?: {enabled?: boolean},
) {
  return useQuery({
    queryKey: RQKEY_AUTOCOMPLETE(query),
    queryFn: () => fetchKlipyAutocomplete(query),
    enabled: query.length > 0 && options?.enabled !== false,
    staleTime: STALE.HOURS.ONE,
  })
}
```

- [ ] **Step 5: Verify typecheck passes**

Run: `yarn typecheck`
Expected: No new errors

- [ ] **Step 6: Commit**

```bash
git add src/state/queries/klipy.ts
git commit -m "feat(gif): add useKlipyAutocompleteQuery hook for Klipy typeahead"
```

---

### Task 3: Create `useGifAutocomplete` Orchestration Hook

**Files:**
- Create: `src/features/gifPicker/hooks/useGifAutocomplete.ts`

- [ ] **Step 1: Create the hook file**

Create `src/features/gifPicker/hooks/useGifAutocomplete.ts`:

```ts
import {useRef, useState} from 'react'

import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {useKlipyAutocompleteQuery} from '#/state/queries/klipy'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'

export type GifAutocompleteState = {
  /** The suggestion strings to display */
  suggestions: string[]
  /** Whether the suggestion list should be visible */
  isVisible: boolean
  /** Index of the keyboard-highlighted suggestion (web only), -1 = none */
  activeIndex: number
  /** Call when the user selects a suggestion */
  selectSuggestion: (suggestion: string) => void
  /** Call when the raw search text changes (from the input's onChangeText) */
  handleTextChange: (text: string) => void
  /** Call with the key event from the search input (web only) */
  handleKeyDown: (key: string) => boolean
  /** Call to dismiss suggestions (e.g. escape key) */
  dismiss: () => void
}

export function useGifAutocomplete({
  onSelectSuggestion,
}: {
  onSelectSuggestion: (text: string) => void
}): GifAutocompleteState {
  const ax = useAnalytics()
  const useKlipy = ax.features.enabled(ax.features.KlipyGifProviderEnable)

  const [rawText, setRawText] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const justSelectedRef = useRef(false)

  const autocompleteQuery = useThrottledValue(rawText, 200)
  const {data: suggestions} = useKlipyAutocompleteQuery(autocompleteQuery, {
    enabled: useKlipy && !justSelectedRef.current,
  })

  const [activeIndex, setActiveIndex] = useState(-1)

  const isVisible =
    rawText.length > 0 &&
    !dismissed &&
    !justSelectedRef.current &&
    (suggestions?.length ?? 0) > 0

  const handleTextChange = (text: string) => {
    setRawText(text)
    if (justSelectedRef.current) {
      justSelectedRef.current = false
    }
    setDismissed(false)
    setActiveIndex(-1)
  }

  const selectSuggestion = (suggestion: string) => {
    justSelectedRef.current = true
    setRawText(suggestion)
    setActiveIndex(-1)
    onSelectSuggestion(suggestion)
  }

  const dismiss = () => {
    setDismissed(true)
    setActiveIndex(-1)
  }

  const handleKeyDown = (key: string): boolean => {
    if (!IS_WEB || !isVisible || !suggestions?.length) return false

    switch (key) {
      case 'ArrowDown': {
        setActiveIndex(i => (i + 1) % suggestions.length)
        return true
      }
      case 'ArrowUp': {
        setActiveIndex(i =>
          i <= 0 ? suggestions.length - 1 : i - 1,
        )
        return true
      }
      case 'Enter': {
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectSuggestion(suggestions[activeIndex])
          return true
        }
        return false
      }
      case 'Escape': {
        dismiss()
        return true
      }
      default:
        return false
    }
  }

  return {
    suggestions: suggestions ?? [],
    isVisible,
    activeIndex,
    selectSuggestion,
    handleTextChange,
    handleKeyDown,
    dismiss,
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/features/gifPicker/hooks/useGifAutocomplete.ts
git commit -m "feat(gif): add useGifAutocomplete orchestration hook"
```

---

### Task 4: Create `GifAutocompleteSuggestions` Component

**Files:**
- Create: `src/features/gifPicker/components/GifAutocompleteSuggestions.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/gifPicker/components/GifAutocompleteSuggestions.tsx`:

```tsx
import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, web} from '#/alf'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass'
import {Text} from '#/components/Typography'

const LISTBOX_ID = 'gif-autocomplete-listbox'

export function suggestionItemId(index: number) {
  return `gif-autocomplete-option-${index}`
}

export {LISTBOX_ID as GIF_AUTOCOMPLETE_LISTBOX_ID}

export function GifAutocompleteSuggestions({
  suggestions,
  activeIndex,
  onSelect,
}: {
  suggestions: string[]
  activeIndex: number
  onSelect: (suggestion: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  if (suggestions.length === 0) return null

  return (
    <View
      role="listbox"
      id={LISTBOX_ID}
      aria-label={_(msg`Search suggestions`)}
      style={[a.rounded_sm, a.overflow_hidden, a.mt_xs, a.mb_sm]}>
      {suggestions.map((suggestion, index) => {
        const isActive = index === activeIndex
        return (
          <Pressable
            key={suggestion}
            role="option"
            id={suggestionItemId(index)}
            aria-selected={isActive}
            accessibilityLabel={suggestion}
            onPress={() => onSelect(suggestion)}
            style={state => [
              a.flex_row,
              a.align_center,
              a.gap_sm,
              a.px_md,
              a.py_sm,
              (isActive || ('hovered' in state && state.hovered)) &&
                t.atoms.bg_contrast_25,
            ]}>
            <SearchIcon
              size="sm"
              fill={t.atoms.text_contrast_medium.color}
            />
            <Text
              style={[a.text_md, a.flex_1]}
              numberOfLines={1}>
              {suggestion}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/features/gifPicker/components/GifAutocompleteSuggestions.tsx
git commit -m "feat(gif): add GifAutocompleteSuggestions inline list component"
```

---

### Task 5: Wire Autocomplete into `GifPickerHeader`

**Files:**
- Modify: `src/features/gifPicker/components/GifPickerHeader.tsx`

- [ ] **Step 1: Update the component**

Replace the entire contents of `src/features/gifPicker/components/GifPickerHeader.tsx` with:

```tsx
import {type Ref} from 'react'
import {type TextInput, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, native, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {ArrowLeft_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass'
import {IS_WEB} from '#/env'
import {type GifAutocompleteState} from '#/features/gifPicker/hooks/useGifAutocomplete'
import {
  GIF_AUTOCOMPLETE_LISTBOX_ID,
  GifAutocompleteSuggestions,
  suggestionItemId,
} from '#/features/gifPicker/components/GifAutocompleteSuggestions'

export function GifPickerHeader({
  inputRef,
  onChangeText,
  onClose,
  onEscape,
  autocomplete,
}: {
  inputRef: Ref<TextInput>
  onChangeText: (text: string) => void
  onClose: () => void
  onEscape: () => void
  autocomplete: GifAutocompleteState
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  return (
    <View
      style={[
        native(a.pt_4xl),
        a.relative,
        a.mb_lg,
        a.pb_sm,
        t.atoms.bg,
      ]}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          !gtMobile && web(a.gap_md),
        ]}>
        {!gtMobile && IS_WEB && (
          <Button
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={onClose}
            label={_(msg`Close GIF dialog`)}>
            <ButtonIcon icon={Arrow} size="md" />
          </Button>
        )}

        <TextField.Root style={[!gtMobile && IS_WEB && a.flex_1]}>
          <TextField.Icon icon={Search} />
          <TextField.Input
            label={_(msg`Search GIFs`)}
            placeholder={_(msg`Search GIFs`)}
            onChangeText={onChangeText}
            returnKeyType="search"
            clearButtonMode="while-editing"
            inputRef={inputRef}
            maxLength={50}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key === 'Escape') {
                if (!autocomplete.handleKeyDown('Escape')) {
                  onEscape()
                }
              } else {
                autocomplete.handleKeyDown(nativeEvent.key)
              }
            }}
            // @ts-ignore web-only ARIA props
            role={autocomplete.isVisible ? 'combobox' : undefined}
            aria-controls={
              autocomplete.isVisible
                ? GIF_AUTOCOMPLETE_LISTBOX_ID
                : undefined
            }
            aria-expanded={autocomplete.isVisible}
            aria-autocomplete={autocomplete.isVisible ? 'list' : undefined}
            aria-activedescendant={
              autocomplete.isVisible && autocomplete.activeIndex >= 0
                ? suggestionItemId(autocomplete.activeIndex)
                : undefined
            }
          />
        </TextField.Root>
      </View>

      {autocomplete.isVisible && (
        <GifAutocompleteSuggestions
          suggestions={autocomplete.suggestions}
          activeIndex={autocomplete.activeIndex}
          onSelect={autocomplete.selectSuggestion}
        />
      )}
    </View>
  )
}
```

Key changes from the original:
- Added `autocomplete` prop of type `GifAutocompleteState`
- Wrapped the search row and suggestion list in a single `View` (the outer `View` no longer has `a.flex_row` / `a.align_center` — those moved to an inner `View` so suggestions render below)
- `onKeyPress` now delegates to `autocomplete.handleKeyDown` first; Escape is handled by autocomplete if suggestions are visible, otherwise falls through to `onEscape`
- Added ARIA attributes to the input when suggestions are visible
- Renders `GifAutocompleteSuggestions` below the input when `autocomplete.isVisible`

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: Errors in `GifPickerDialog.tsx` because `GifPickerHeader` now requires the `autocomplete` prop. This is expected and will be fixed in Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/features/gifPicker/components/GifPickerHeader.tsx
git commit -m "feat(gif): wire autocomplete suggestions into GifPickerHeader"
```

---

### Task 6: Wire Everything into `GifPickerDialog`

**Files:**
- Modify: `src/features/gifPicker/GifPickerDialog.tsx`

- [ ] **Step 1: Update GifPickerBody**

Replace the `GifPickerBody` function in `src/features/gifPicker/GifPickerDialog.tsx` (lines 56-140) with:

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
  const search = useThrottledValue(rawSearch, 500)

  const autocomplete = useGifAutocomplete({
    onSelectSuggestion: text => {
      setRawSearch(text)
      // Set the TextInput's displayed value to match
      textInputRef.current?.setNativeProps({text})
      listRef.current?.scrollToOffset({offset: 0, animated: false})
    },
  })

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
  } = useGifPickerData(search)

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
    } else {
      control.close()
    }
  }

  const onChangeSearch = (text: string) => {
    setRawSearch(text)
    autocomplete.handleTextChange(text)
    listRef.current?.scrollToOffset({offset: 0, animated: false})
  }

  const header = (
    <>
      <GifPickerHeader
        inputRef={textInputRef}
        onChangeText={onChangeSearch}
        onClose={() => control.close()}
        onEscape={() => control.close()}
        autocomplete={autocomplete}
      />
      {!hasData && (
        <GifPickerPlaceholder
          isLoading={isPending}
          isError={isError}
          isSearching={isSearching}
          query={search}
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

- [ ] **Step 2: Add the import**

At the top of `src/features/gifPicker/GifPickerDialog.tsx`, add after the existing imports:

```ts
import {useGifAutocomplete} from '#/features/gifPicker/hooks/useGifAutocomplete'
```

- [ ] **Step 3: Verify typecheck passes**

Run: `yarn typecheck`
Expected: No errors

- [ ] **Step 4: Verify lint passes**

Run: `yarn lint`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add src/features/gifPicker/GifPickerDialog.tsx
git commit -m "feat(gif): wire useGifAutocomplete into GifPickerDialog"
```

---

### Task 7: Manual Testing

- [ ] **Step 1: Start web dev server**

Run: `yarn web`

- [ ] **Step 2: Test the happy path**

1. Open the composer and click the GIF button to open the dialog
2. Start typing a search term (e.g., "hap")
3. Verify suggestions appear below the search input within ~200ms
4. Verify suggestions update as you continue typing
5. Click a suggestion — verify it fills the input and GIF results load
6. Verify suggestions disappear after selection

- [ ] **Step 3: Test keyboard navigation (web)**

1. Type a partial query (e.g., "dan")
2. Press ArrowDown — verify the first suggestion highlights
3. Press ArrowDown again — verify highlight moves to second suggestion
4. Press ArrowUp — verify highlight moves back
5. Press Enter — verify the highlighted suggestion is selected, input fills, GIFs load
6. Press Escape while suggestions are visible — verify suggestions dismiss but dialog stays open
7. Press Escape again — verify dialog closes

- [ ] **Step 4: Test edge cases**

1. Type and then clear the input — verify suggestions disappear
2. Select a suggestion, then backspace to edit — verify suggestions re-appear
3. Type something with no autocomplete results — verify no suggestion list renders
4. Rapidly type and delete — verify no visual glitches or stale suggestions
5. Verify the GIF grid still scrolls and paginates normally when suggestions are not visible

- [ ] **Step 5: Test on Tenor path**

1. If you can disable the `KlipyGifProviderEnable` feature flag, verify the GIF picker works normally without autocomplete (no suggestions, no errors)
2. If you can't toggle the flag, verify there are no runtime errors when the hook is called — it should simply never show suggestions

- [ ] **Step 6: Commit any fixes from testing**

If any issues were found and fixed during testing, commit them:

```bash
git add -A
git commit -m "fix(gif): address issues found during manual autocomplete testing"
```
