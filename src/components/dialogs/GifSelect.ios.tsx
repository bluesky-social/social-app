import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Modal, ScrollView, TextInput, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {
  Gif,
  useFeaturedGifsQuery,
  useGifSearchQuery,
} from '#/state/queries/tenor'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {FlatList_INTERNAL} from '#/view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Button, ButtonText} from '../Button'
import {Handle} from '../Dialog'
import {useThrottledValue} from '../hooks/useThrottledValue'
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
  const t = useTheme()
  const [open, setOpen] = useState(false)

  useImperativeHandle(controlRef, () => ({
    open: () => setOpen(true),
  }))

  const close = useCallback(() => {
    setOpen(false)
    onClose()
  }, [onClose])

  const onSelectGif = useCallback(
    (gif: Gif) => {
      onSelectGifProp(gif)
      close()
    },
    [onSelectGifProp, close],
  )

  const renderErrorBoundary = useCallback(
    (error: any) => <ModalError details={String(error)} close={close} />,
    [close],
  )

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={close}
      aria-modal
      accessibilityViewIsModal>
      <View style={[a.flex_1, t.atoms.bg]}>
        <Handle />
        <ErrorBoundary renderError={renderErrorBoundary}>
          <GifList onSelectGif={onSelectGif} close={close} />
        </ErrorBoundary>
      </View>
    </Modal>
  )
}

function GifList({
  onSelectGif,
}: {
  close: () => void
  onSelectGif: (gif: Gif) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const textInputRef = useRef<TextInput>(null)
  const listRef = useRef<FlatList_INTERNAL>(null)
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
      close()
    }
  }, [isSearching])

  const listHeader = useMemo(() => {
    return (
      <View style={[a.relative, a.mb_lg, a.pt_4xl, a.flex_row, a.align_center]}>
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
          />
        </TextField.Root>
      </View>
    )
  }, [t.atoms.bg, _])

  return (
    <FlatList_INTERNAL
      ref={listRef}
      key={gtMobile ? '3 cols' : '2 cols'}
      data={flattenedData}
      renderItem={renderItem}
      numColumns={gtMobile ? 3 : 2}
      columnWrapperStyle={a.gap_sm}
      contentContainerStyle={a.px_lg}
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
  )
}

function ModalError({details, close}: {details?: string; close: () => void}) {
  const {_} = useLingui()

  return (
    <ScrollView
      style={[a.flex_1, a.gap_md]}
      centerContent
      contentContainerStyle={a.px_lg}>
      <ErrorScreen
        title={_(msg`Oh no!`)}
        message={_(
          msg`There was an unexpected issue in the application. Please let us know if this happened to you!`,
        )}
        details={details}
      />
      <Button
        label={_(msg`Close dialog`)}
        onPress={close}
        color="primary"
        size="medium"
        variant="solid">
        <ButtonText>
          <Trans>Close</Trans>
        </ButtonText>
      </Button>
    </ScrollView>
  )
}
