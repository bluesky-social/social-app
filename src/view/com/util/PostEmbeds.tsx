import React from 'react'
import {StyleSheet, StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyEmbedImages, AppBskyEmbedExternal} from '@atproto/api'
import {Link} from '../util/Link'
import {Text} from './text/Text'
import {AutoSizedImage} from './images/AutoSizedImage'
import {ImageLayoutGrid} from './images/ImageLayoutGrid'
import {ImagesLightbox} from '../../../state/models/shell-ui'
import {useStores} from '../../../state'
import {usePalette} from '../../lib/hooks/usePalette'

type Embed =
  | AppBskyEmbedImages.Presented
  | AppBskyEmbedExternal.Presented
  | {$type: string; [k: string]: unknown}

export function PostEmbeds({
  embed,
  style,
}: {
  embed?: Embed
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const store = useStores()
  if (AppBskyEmbedImages.isPresented(embed)) {
    if (embed.images.length > 0) {
      const uris = embed.images.map(img => img.fullsize)
      const openLightbox = (index: number) => {
        store.shell.openLightbox(new ImagesLightbox(uris, index))
      }
      if (embed.images.length === 4) {
        return (
          <View style={styles.imagesContainer}>
            <ImageLayoutGrid
              type="four"
              uris={embed.images.map(img => img.thumb)}
              onPress={openLightbox}
            />
          </View>
        )
      } else if (embed.images.length === 3) {
        return (
          <View style={styles.imagesContainer}>
            <ImageLayoutGrid
              type="three"
              uris={embed.images.map(img => img.thumb)}
              onPress={openLightbox}
            />
          </View>
        )
      } else if (embed.images.length === 2) {
        return (
          <View style={styles.imagesContainer}>
            <ImageLayoutGrid
              type="two"
              uris={embed.images.map(img => img.thumb)}
              onPress={openLightbox}
            />
          </View>
        )
      } else {
        return (
          <View style={styles.imagesContainer}>
            <AutoSizedImage
              uri={embed.images[0].thumb}
              onPress={() => openLightbox(0)}
              containerStyle={{borderRadius: 4}}
            />
          </View>
        )
      }
    }
  }
  if (AppBskyEmbedExternal.isPresented(embed)) {
    const link = embed.external
    return (
      <Link
        style={[styles.extOuter, pal.view, pal.border, style]}
        href={link.uri}
        noFeedback>
        {link.thumb ? (
          <AutoSizedImage uri={link.thumb} containerStyle={{borderRadius: 4}} />
        ) : undefined}
        <Text type="h5" numberOfLines={1} style={pal.text}>
          {link.title || link.uri}
        </Text>
        <Text type="body2" numberOfLines={1} style={pal.textLight}>
          {link.uri}
        </Text>
        {link.description ? (
          <Text
            type="body1"
            numberOfLines={2}
            style={[pal.text, styles.extDescription]}>
            {link.description}
          </Text>
        ) : undefined}
      </Link>
    )
  }
  return <View />
}

const styles = StyleSheet.create({
  imagesContainer: {
    marginTop: 4,
    marginBottom: 6,
  },
  extOuter: {
    padding: 10,
    borderWidth: 1,
  },
  extDescription: {
    marginTop: 4,
  },
})
