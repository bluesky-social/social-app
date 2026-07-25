import {useEffect, useRef, useState} from 'react'
import {type TextInput} from 'react-native'

import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {type ListMethods} from '#/view/com/util/List'
import {ios} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {
  GIF_CATEGORIES,
  type GifCategory,
  GifCategoryPills,
} from '#/features/gifPicker/components/GifCategoryPills'
import {GifPickerErrorBoundary} from '#/features/gifPicker/components/GifPickerErrorBoundary'
import {GifPickerGrid} from '#/features/gifPicker/components/GifPickerGrid'
import {GifPickerHeader} from '#/features/gifPicker/components/GifPickerHeader'
import {GifPickerPlaceholder} from '#/features/gifPicker/components/GifPickerPlaceholder'
import {useGifPickerData} from '#/features/gifPicker/hooks/useGifPickerData'
import {useRecentGifs} from '#/features/gifPicker/hooks/useRecentGifs'
import {type Gif} from '#/features/gifPicker/types'

export function GifPickerDialog({
  control,
  onClose,
  onSelectGif: onSelectGifProp,
}: {
  control: Dialog.DialogControlProps
  onClose?: () => void
  onSelectGif: (gif: Gif) => void
}) {
  const onSelectGif = (gif: Gif) => {
    control.close(() => onSelectGifProp(gif))
  }

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{
        bottomInset: 0,
        // use system corner radius on iOS
        ...ios({cornerRadius: undefined}),
        fullHeight: true,
      }}>
      <Dialog.Handle />
      <ErrorBoundary
        renderError={error => (
          <GifPickerErrorBoundary details={String(error)} />
        )}>
        <GifPickerBody control={control} onSelectGif={onSelectGif} />
      </ErrorBoundary>
    </Dialog.Outer>
  )
}

function GifPickerBody({
  control,
  onSelectGif,
}: {
  control: Dialog.DialogControlProps
  onSelectGif: (gif: Gif) => void
}) {
  const textInputRef = useRef<TextInput>(null)
  const listRef = useRef<ListMethods>(null)
  const [rawSearch, setRawSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('trending')
  const search = useThrottledValue(rawSearch, 750)
  const {getRecents, addRecent, hasRecents} = useRecentGifs()

  // Determine the effective search query:
  // - If user is typing, use the throttled text
  // - If user clears the input, immediately drop the search (don't wait for
  //   the throttle to catch up — otherwise the previous query keeps driving
  //   the visible results until the next interval tick)
  // - If a non-trending category is active, use its searchterm
  // - Otherwise (trending/recents), empty string triggers the featured endpoint
  const activeCategorySearchterm =
    GIF_CATEGORIES.find(c => c.id === activeCategory)?.searchterm ?? ''
  const effectiveSearch =
    rawSearch.length > 0 && search.length > 0
      ? search
      : activeCategorySearchterm

  const isRecentsActive = activeCategory === 'recents' && rawSearch.length === 0

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
  } = useGifPickerData(effectiveSearch, {enabled: !isRecentsActive})

  const networkItems = dedupeById(
    data?.pages.flatMap(page => page.results) ?? [],
  )
  const items = isRecentsActive ? getRecents() : networkItems
  const hasData = items.length > 0

  const onEndReached = () => {
    if (isRecentsActive) return
    if (isFetchingNextPage || !hasNextPage || error) return
    void fetchNextPage()
  }

  // Scroll to top when the effective query/category changes, NOT on every
  // keystroke. Calling scrollToOffset on the FlatList while its sticky header
  // holds the focused input blurs that input on web.
  useEffect(() => {
    listRef.current?.scrollToOffset({offset: 0, animated: false})
  }, [effectiveSearch, isRecentsActive])

  const onClearSearch = () => {
    textInputRef.current?.clear()
    setRawSearch('')
    setActiveCategory('trending')
    textInputRef.current?.focus()
  }

  const onGoBack = () => {
    if (isSearching || activeCategory !== 'trending') {
      onClearSearch()
    } else {
      control.close()
    }
  }

  const onChangeSearch = (text: string) => {
    setRawSearch(text)
  }

  const onSelectCategory = (category: GifCategory) => {
    setActiveCategory(category.id)
  }

  const handleSelectGif = (gif: Gif) => {
    addRecent(gif)
    onSelectGif(gif)
  }

  const showPills = rawSearch.length === 0

  const header = (
    <>
      <GifPickerHeader
        inputRef={textInputRef}
        onChangeText={onChangeSearch}
        onClear={onClearSearch}
        canClear={rawSearch.length > 0}
        onEscape={() => control.close()}
      />
      {showPills && (
        <GifCategoryPills
          activeId={activeCategory}
          onSelect={onSelectCategory}
          hasRecents={hasRecents}
        />
      )}
      {!hasData && (
        <GifPickerPlaceholder
          isLoading={!isRecentsActive && isPending}
          isError={!isRecentsActive && isError}
          isSearching={isSearching}
          isRecentsEmpty={isRecentsActive}
          query={effectiveSearch}
          onRetry={refetch}
          onGoBack={onGoBack}
        />
      )}
    </>
  )

  return (
    <>
      <Dialog.Close />
      <GifPickerGrid
        ref={listRef}
        items={items}
        header={header}
        hasData={hasData}
        isFetchingNextPage={!isRecentsActive && isFetchingNextPage}
        error={isRecentsActive ? null : error}
        fetchNextPage={fetchNextPage}
        onEndReached={onEndReached}
        onSelectGif={handleSelectGif}
      />
    </>
  )
}

function dedupeById(items: Gif[]): Gif[] {
  const seen = new Set<string>()
  const out: Gif[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}
