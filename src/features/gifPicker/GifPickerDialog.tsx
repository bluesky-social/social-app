import {useImperativeHandle, useRef, useState} from 'react'
import {type TextInput} from 'react-native'

import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {type ListMethods} from '#/view/com/util/List'
import {ios, useBreakpoints} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
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
  const search = useThrottledValue(rawSearch, 750)

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
    listRef.current?.scrollToOffset({offset: 0, animated: false})
  }

  const header = (
    <>
      <GifPickerHeader
        inputRef={textInputRef}
        onChangeText={onChangeSearch}
        onClose={() => control.close()}
        onEscape={() => control.close()}
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
