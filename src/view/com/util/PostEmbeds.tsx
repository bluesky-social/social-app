import React from 'react'
import {ImageStyle, StyleSheet, StyleProp, View, ViewStyle} from 'react-native'
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
  if (embed?.$type === 'app.bsky.embed.images#presented') {
    const imgEmbed = embed as AppBskyEmbedImages.Presented
    if (imgEmbed.images.length > 0) {
      const uris = imgEmbed.images.map(img => img.fullsize)
      const openLightbox = (index: number) => {
        store.shell.openLightbox(new ImagesLightbox(uris, index))
      }
      if (imgEmbed.images.length === 4) {
        return (
          <View style={styles.imagesContainer}>
            <ImageLayoutGrid
              type="four"
              uris={imgEmbed.images.map(img => img.thumb)}
              onPress={openLightbox}
            />
          </View>
        )
      } else if (imgEmbed.images.length === 3) {
        return (
          <View style={styles.imagesContainer}>
            <ImageLayoutGrid
              type="three"
              uris={imgEmbed.images.map(img => img.thumb)}
              onPress={openLightbox}
            />
          </View>
        )
      } else if (imgEmbed.images.length === 2) {
        return (
          <View style={styles.imagesContainer}>
            <ImageLayoutGrid
              type="two"
              uris={imgEmbed.images.map(img => img.thumb)}
              onPress={openLightbox}
            />
          </View>
        )
      } else {
        return (
          <View style={styles.imagesContainer}>
            <AutoSizedImage
              uri={imgEmbed.images[0].thumb}
              onPress={() => openLightbox(0)}
              containerStyle={{borderRadius: 4}}
            />
          </View>
        )
      }
    }
  }
  if (embed?.$type === 'app.bsky.embed.external#presented') {
    const externalEmbed = embed as AppBskyEmbedExternal.Presented
    const link = externalEmbed.external
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
  },
  extDescription: {
    marginTop: 4,
  },
})
