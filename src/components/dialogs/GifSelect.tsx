import React, {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {GIPHY_PRIVACY_POLICY} from '#/lib/constants'
import {cleanError} from '#/lib/strings/errors'
import {isWeb} from '#/platform/detection'
import {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from '#/state/preferences'
import {Gif, useGifphySearch, useGiphyTrending} from '#/state/queries/giphy'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {ArrowLeft_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Link} from '#/components/Link'
import {Button, ButtonIcon, ButtonText} from '../Button'
import {ListFooter} from '../Lists'
import {Text} from '../Typography'

export function GifSelectDialog({
  control,
  onClose,
  onSelectGif: onSelectGifProp,
}: {
  control: Dialog.DialogControlProps
  onClose: () => void
  onSelectGif: (url: string) => void
}) {
  const externalEmbedsPrefs = useExternalEmbedsPrefs()
  const onSelectGif = useCallback(
    (url: string) => {
      control.close(() => onSelectGifProp(url))
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
      content = <GiphyConsentNotGiven control={control} />
      break
    default:
      content = <GiphyConsentPrompt control={control} />
      break
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{sheet: {snapPoints}}}
      onClose={onClose}>
      <Dialog.Handle />
      {content}
    </Dialog.Outer>
  )
}

function GifList({
  control,
  onSelectGif,
}: {
  control: Dialog.DialogControlProps
  onSelectGif: (url: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const [search, setSearch] = useState('')

  const isSearching = search.length > 0

  const trendingQuery = useGiphyTrending()
  const searchQuery = useGifphySearch(search)

  const {data, fetchNextPage, isFetchingNextPage, hasNextPage, error} =
    isSearching ? searchQuery : trendingQuery

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

  const listHeader = useMemo(
    () => (
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
            {top: 0, left: 0, right: 0, height: '50%'},
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
            value={search}
            onChangeText={setSearch}
          />
        </TextField.Root>
      </View>
    ),
    [search, _, t.atoms.bg, gtMobile, control],
  )

  return (
    <>
      {gtMobile && <Dialog.Close />}
      <Dialog.InnerFlatList
        key={gtMobile ? '3 cols' : '2 cols'}
        data={flattenedData}
        renderItem={renderItem}
        numColumns={gtMobile ? 3 : 2}
        columnWrapperStyle={a.gap_sm}
        ListHeaderComponent={listHeader}
        stickyHeaderIndices={[0]}
        onEndReached={onEndReached}
        onEndReachedThreshold={4}
        keyExtractor={(item: Gif) => item.id}
        // @ts-expect-error web only
        style={isWeb && {minHeight: '100vh'}}
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={fetchNextPage}
            style={{borderTopWidth: 0}}
          />
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
  onSelectGif: (url: string) => void
}) {
  const {gtTablet} = useBreakpoints()
  const {_} = useLingui()
  const t = useTheme()

  const onPress = useCallback(() => {
    onSelectGif(gif.url)
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
          autoplay
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
              <Link to={GIPHY_PRIVACY_POLICY}>
                <Text>privacy policy</Text>
              </Link>
              .
            </Trans>
          </Text>
        </View>
      </View>
      <View style={a.gap_md}>
        <Button
          style={gtMobile && a.flex_1}
          label={_(msg`Enable GIPHY`)}
          onPress={onShowPress}
          onAccessibilityEscape={control.close}
          color="primary"
          size="medium"
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
          size="medium"
          variant="ghost">
          <ButtonText>
            <Trans>No thanks</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}

function GiphyConsentNotGiven({control}: {control: Dialog.DialogControlProps}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const setExternalEmbedPref = useSetExternalEmbedPref()

  const onRedecidePress = useCallback(() => {
    setExternalEmbedPref('giphy', undefined)
  }, [setExternalEmbedPref])

  return (
    <Dialog.ScrollableInner label={_(msg`Permission to use GIPHY`)}>
      <View style={a.gap_sm}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>You've opted out of GIPHY.</Trans>
        </Text>

        <Text style={[a.mt_sm, a.mb_2xl]}>
          <Trans>
            Bluesky uses GIPHY to provide the GIF selector feature. You can opt
            back in at any time.
          </Trans>
        </Text>
      </View>
      <View style={a.gap_md}>
        <Button
          style={gtMobile && a.flex_1}
          label={_(msg`I changed my mind`)}
          onPress={onRedecidePress}
          onAccessibilityEscape={control.close}
          color="secondary"
          size="medium"
          variant="solid">
          <ButtonText>
            <Trans>I changed my mind</Trans>
          </ButtonText>
        </Button>
        <Button
          label={_(msg`No thanks`)}
          onAccessibilityEscape={control.close}
          onPress={() => control.close()}
          color="secondary"
          size="medium"
          variant="ghost">
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}
