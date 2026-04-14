import {useImperativeHandle, useRef, useState} from 'react'
import {type TextInput} from 'react-native'

import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {type ListMethods} from '#/view/com/util/List'
import {ios, useBreakpoints} from '#/alf'
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
import {type Gif} from '#/features/gifPicker/types'

export function GifPickerDialog({
  controlRef,
  onClose,
  onSelectGif: onSelectGifProp,
}: {
  controlRef: React.RefObject<{open: () => void} | null>
  onClose?: () => void
  onSelectGif: (gif: Gif) => void
}) {
  const control = Dialog.useDialogControl()

  useImperativeHandle(controlRef, () => ({
    open: () => control.open(),
  }))

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
