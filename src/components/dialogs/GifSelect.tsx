import React, {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {Gif, useGifphySearch, useGiphyTrending} from '#/state/queries/giphy'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Button} from '../Button'
import {ListFooter} from '../Lists'

export function GifSelectDialog({
  control,
  onClose,
  onSelectGif: onSelectGifProp,
}: {
  control: Dialog.DialogControlProps
  onClose: () => void
  onSelectGif: (url: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
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

  const onEndReached = React.useCallback(() => {
    if (isFetchingNextPage || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  const listHeader = useMemo(
    () => (
      <View style={[a.relative, a.mb_lg]}>
        {/* cover top corners */}
        <View
          style={[
            a.absolute,
            {top: 0, left: 0, right: 0, height: '50%'},
            t.atoms.bg,
          ]}
        />
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
    [search, _, t.atoms.bg],
  )

  const onSelectGif = useCallback(
    (url: string) => {
      control.close(() => onSelectGifProp(url))
    },
    [control, onSelectGifProp],
  )

  const renderItem = useCallback(
    ({item}: {item: Gif}) => {
      return <GifPreview gif={item} onSelectGif={onSelectGif} />
    },
    [onSelectGif],
  )

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{sheet: {snapPoints: ['100%']}}}
      webOptions={{style: {maxHeight: '100vh', height: '800px'}}}
      onClose={onClose}>
      <Dialog.Handle />
      <Dialog.InnerFlatList
        data={flattenedData}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={a.gap_sm}
        ListHeaderComponent={listHeader}
        stickyHeaderIndices={[0]}
        onEndReached={onEndReached}
        onEndReachedThreshold={4}
        keyExtractor={(item: Gif) => item.id}
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={fetchNextPage}
            style={{borderTopWidth: 0}}
          />
        }
      />
    </Dialog.Outer>
  )
}

function GifPreview({
  gif,
  onSelectGif,
}: {
  gif: Gif
  onSelectGif: (url: string) => void
}) {
  const {_} = useLingui()

  const onPress = useCallback(() => {
    onSelectGif(gif.url)
  }, [onSelectGif, gif])

  return (
    <Button
      label={_(msg`Select GIF "${gif.title}"`)}
      style={a.flex_1}
      onPress={onPress}>
      {({pressed}) => (
        <Image
          style={[
            a.flex_1,
            a.mb_sm,
            a.rounded_sm,
            {aspectRatio: 1, opacity: pressed ? 0.8 : 1},
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
