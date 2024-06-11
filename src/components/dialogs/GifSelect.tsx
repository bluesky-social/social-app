import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {TextInput, View} from 'react-native'
import {BottomSheetFlatListMethods} from '@discord/bottom-sheet'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {isWeb} from '#/platform/detection'
import {
  Gif,
  useFeaturedGifsQuery,
  useGifSearchQuery,
} from '#/state/queries/tenor'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {ArrowLeft_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Button, ButtonIcon, ButtonText} from '../Button'
import {ListFooter, ListMaybePlaceholder} from '../Lists'
import {GifPreview} from './GifSelect.shared'

export function GifSelectDialog({
  controlRef,
  onClose,
  onSelectGif: onSelectGifProp,
}: {
  controlRef: React.RefObject<{open: () => void}>
  onClose: () => void
  onSelectGif: (gif: Gif) => void
}) {
  const control = Dialog.useDialogControl()

  useImperativeHandle(controlRef, () => ({
    open: () => control.open(),
  }))

  const onSelectGif = useCallback(
    (gif: Gif) => {
      control.close(() => onSelectGifProp(gif))
    },
    [control, onSelectGifProp],
  )

  const renderErrorBoundary = useCallback(
    (error: any) => <DialogError details={String(error)} />,
    [],
  )

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{sheet: {snapPoints: ['100%']}}}
      onClose={onClose}>
      <Dialog.Handle />
      <ErrorBoundary renderError={renderErrorBoundary}>
        <GifList control={control} onSelectGif={onSelectGif} />
      </ErrorBoundary>
    </Dialog.Outer>
  )
}

function GifList({
  control,
  onSelectGif,
}: {
  control: Dialog.DialogControlProps
  onSelectGif: (gif: Gif) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const textInputRef = useRef<TextInput>(null)
  const listRef = useRef<BottomSheetFlatListMethods>(null)
  const [undeferredSearch, setSearch] = useState('')
  const search = useThrottledValue(undeferredSearch, 500)

  const isSearching = search.length > 0

  const trendingQuery = useFeaturedGifsQuery()
  const searchQuery = useGifSearchQuery(search)

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    error,
    isLoading,
    isError,
    refetch,
  } = isSearching ? searchQuery : trendingQuery

  const flattenedData = useMemo(() => {
    return data?.pages.flatMap(page => page.results) || []
  }, [data])

  const renderItem = useCallback(
    ({item}: {item: Gif}) => {
      return <GifPreview gif={item} onSelectGif={onSelectGif} />
    },
    [onSelectGif],
  )

  const onEndReached = React.useCallback(() => {
    if (isFetchingNextPage || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  const hasData = flattenedData.length > 0

  const onGoBack = useCallback(() => {
    if (isSearching) {
      // clear the input and reset the state
      textInputRef.current?.clear()
      setSearch('')
    } else {
      control.close()
    }
  }, [control, isSearching])

  const listHeader = useMemo(() => {
    return (
      <View
        style={[
          a.relative,
          a.mb_lg,
          a.flex_row,
          a.align_center,
          !gtMobile && isWeb && a.gap_md,
        ]}>
        {/* cover top corners */}
        <View
          style={[
            a.absolute,
            a.inset_0,
            {
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            },
            t.atoms.bg,
          ]}
        />

        {!gtMobile && isWeb && (
          <Button
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={() => control.close()}
            label={_(msg`Close GIF dialog`)}>
            <ButtonIcon icon={Arrow} size="md" />
          </Button>
        )}

        <TextField.Root>
          <TextField.Icon icon={Search} />
          <TextField.Input
            label={_(msg`Search GIFs`)}
            placeholder={_(msg`Search Tenor`)}
            onChangeText={text => {
              setSearch(text)
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
            inputRef={textInputRef}
            maxLength={50}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key === 'Escape') {
                control.close()
              }
            }}
          />
        </TextField.Root>
      </View>
    )
  }, [gtMobile, t.atoms.bg, _, control])

  return (
    <>
      {gtMobile && <Dialog.Close />}
      <Dialog.InnerFlatList
        ref={listRef}
        key={gtMobile ? '3 cols' : '2 cols'}
        data={flattenedData}
        renderItem={renderItem}
        numColumns={gtMobile ? 3 : 2}
        columnWrapperStyle={a.gap_sm}
        ListHeaderComponent={
          <>
            {listHeader}
            {!hasData && (
              <ListMaybePlaceholder
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                onGoBack={onGoBack}
                emptyType="results"
                sideBorders={false}
                topBorder={false}
                errorTitle={_(msg`Failed to load GIFs`)}
                errorMessage={_(msg`There was an issue connecting to Tenor.`)}
                emptyMessage={
                  isSearching
                    ? _(msg`No search results found for "${search}".`)
                    : _(
                        msg`No featured GIFs found. There may be an issue with Tenor.`,
                      )
                }
              />
            )}
          </>
        }
        stickyHeaderIndices={[0]}
        onEndReached={onEndReached}
        onEndReachedThreshold={4}
        keyExtractor={(item: Gif) => item.id}
        // @ts-expect-error web only
        style={isWeb && {minHeight: '100vh'}}
        keyboardDismissMode="on-drag"
        ListFooterComponent={
          hasData ? (
            <ListFooter
              isFetchingNextPage={isFetchingNextPage}
              error={cleanError(error)}
              onRetry={fetchNextPage}
              style={{borderTopWidth: 0}}
            />
          ) : null
        }
      />
    </>
  )
}

function DialogError({details}: {details?: string}) {
  const {_} = useLingui()
  const control = Dialog.useDialogContext()

  return (
    <Dialog.ScrollableInner style={a.gap_md} label={_(msg`An error occured`)}>
      <Dialog.Close />
      <ErrorScreen
        title={_(msg`Oh no!`)}
        message={_(
          msg`There was an unexpected issue in the application. Please let us know if this happened to you!`,
        )}
        details={details}
      />
      <Button
        label={_(msg`Close dialog`)}
        onPress={() => control.close()}
        color="primary"
        size="medium"
        variant="solid">
        <ButtonText>
          <Trans>Close</Trans>
        </ButtonText>
      </Button>
    </Dialog.ScrollableInner>
  )
}
