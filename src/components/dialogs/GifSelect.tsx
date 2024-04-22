import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Keyboard, TextInput, View} from 'react-native'
import {Image} from 'expo-image'
import {BottomSheetFlatListMethods} from '@discord/bottom-sheet'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {GIPHY_PRIVACY_POLICY} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {isWeb} from '#/platform/detection'
import {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from '#/state/preferences'
import {Gif, useGifphySearch, useGiphyTrending} from '#/state/queries/giphy'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {ArrowLeft_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {InlineLinkText} from '#/components/Link'
import {Button, ButtonIcon, ButtonText} from '../Button'
import {ListFooter, ListMaybePlaceholder} from '../Lists'
import {Text} from '../Typography'

export function GifSelectDialog({
  control,
  onClose,
  onSelectGif: onSelectGifProp,
}: {
  control: Dialog.DialogControlProps
  onClose: () => void
  onSelectGif: (gif: Gif) => void
}) {
  const externalEmbedsPrefs = useExternalEmbedsPrefs()
  const onSelectGif = useCallback(
    (gif: Gif) => {
      control.close(() => onSelectGifProp(gif))
    },
    [control, onSelectGifProp],
  )

  let content = null
  let snapPoints
  switch (externalEmbedsPrefs?.giphy) {
    case 'show':
      content = <GifList control={control} onSelectGif={onSelectGif} />
      snapPoints = ['100%']
      break
    case 'hide':
    default:
      content = <GiphyConsentPrompt control={control} />
      break
  }

  const renderErrorBoundary = useCallback(
    (error: any) => <DialogError details={String(error)} />,
    [],
  )

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{sheet: {snapPoints}}}
      onClose={onClose}>
      <Dialog.Handle />
      <ErrorBoundary renderError={renderErrorBoundary}>{content}</ErrorBoundary>
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

  const trendingQuery = useGiphyTrending()
  const searchQuery = useGifphySearch(search)

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
    const uniquenessSet = new Set<string>()

    function filter(gif: Gif) {
      if (!gif) return false
      if (uniquenessSet.has(gif.id)) {
        return false
      }
      uniquenessSet.add(gif.id)
      return true
    }
    return data?.pages.flatMap(page => page.data.filter(filter)) || []
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
            placeholder={_(msg`Powered by GIPHY`)}
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
                errorTitle={_(msg`Failed to load GIFs`)}
                errorMessage={_(msg`There was an issue connecting to GIPHY.`)}
                emptyMessage={
                  isSearching
                    ? _(msg`No search results found for "${search}".`)
                    : _(
                        msg`No trending GIFs found. There may be an issue with GIPHY.`,
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
        onScrollBeginDrag={() => Keyboard.dismiss()}
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

function GifPreview({
  gif,
  onSelectGif,
}: {
  gif: Gif
  onSelectGif: (gif: Gif) => void
}) {
  const {gtTablet} = useBreakpoints()
  const {_} = useLingui()
  const t = useTheme()

  const onPress = useCallback(() => {
    logEvent('composer:gif:select', {})
    onSelectGif(gif)
  }, [onSelectGif, gif])

  return (
    <Button
      label={_(msg`Select GIF "${gif.title}"`)}
      style={[a.flex_1, gtTablet ? {maxWidth: '33%'} : {maxWidth: '50%'}]}
      onPress={onPress}>
      {({pressed}) => (
        <Image
          style={[
            a.flex_1,
            a.mb_sm,
            a.rounded_sm,
            {aspectRatio: 1, opacity: pressed ? 0.8 : 1},
            t.atoms.bg_contrast_25,
          ]}
          source={{uri: gif.images.preview_gif.url}}
          contentFit="cover"
          accessibilityLabel={gif.title}
          accessibilityHint=""
          cachePolicy="none"
          accessibilityIgnoresInvertColors
        />
      )}
    </Button>
  )
}

function GiphyConsentPrompt({control}: {control: Dialog.DialogControlProps}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const setExternalEmbedPref = useSetExternalEmbedPref()

  const onShowPress = useCallback(() => {
    setExternalEmbedPref('giphy', 'show')
  }, [setExternalEmbedPref])

  const onHidePress = useCallback(() => {
    setExternalEmbedPref('giphy', 'hide')
    control.close()
  }, [control, setExternalEmbedPref])

  const gtMobileWeb = gtMobile && isWeb

  return (
    <Dialog.ScrollableInner label={_(msg`Permission to use GIPHY`)}>
      <View style={a.gap_sm}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Permission to use GIPHY</Trans>
        </Text>

        <View style={[a.mt_sm, a.mb_2xl, a.gap_lg]}>
          <Text>
            <Trans>
              Bluesky uses GIPHY to provide the GIF selector feature.
            </Trans>
          </Text>

          <Text style={t.atoms.text_contrast_medium}>
            <Trans>
              GIPHY may collect information about you and your device. You can
              find out more in their{' '}
              <InlineLinkText
                to={GIPHY_PRIVACY_POLICY}
                onPress={() => control.close()}>
                privacy policy
              </InlineLinkText>
              .
            </Trans>
          </Text>
        </View>
      </View>
      <View style={[a.gap_md, gtMobileWeb && a.flex_row_reverse]}>
        <Button
          label={_(msg`Enable GIPHY`)}
          onPress={onShowPress}
          onAccessibilityEscape={control.close}
          color="primary"
          size={gtMobileWeb ? 'small' : 'medium'}
          variant="solid">
          <ButtonText>
            <Trans>Enable GIPHY</Trans>
          </ButtonText>
        </Button>
        <Button
          label={_(msg`No thanks`)}
          onAccessibilityEscape={control.close}
          onPress={onHidePress}
          color="secondary"
          size={gtMobileWeb ? 'small' : 'medium'}
          variant="ghost">
          <ButtonText>
            <Trans>No thanks</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
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
