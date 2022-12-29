import React from 'react'
import {ImageStyle, StyleSheet, StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyEmbedImages, AppBskyEmbedExternal} from '@atproto/api'
import {Link} from '../util/Link'
import {Text} from './text/Text'
import {colors} from '../../lib/styles'
import {AutoSizedImage} from './images/AutoSizedImage'
import {ImagesLightbox} from '../../../state/models/shell-ui'
import {useStores} from '../../../state'
import {useTheme} from '../../lib/ThemeContext'
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
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  if (embed?.$type === 'app.bsky.embed.images#presented') {
    const imgEmbed = embed as AppBskyEmbedImages.Presented
    if (imgEmbed.images.length > 0) {
      const uris = imgEmbed.images.map(img => img.fullsize)
      const openLightbox = (index: number) => {
        store.shell.openLightbox(new ImagesLightbox(uris, index))
      }
      const Thumb = ({i, style}: {i: number; style: StyleProp<ImageStyle>}) => (
        <AutoSizedImage
          style={style}
          uri={imgEmbed.images[i].thumb}
          onPress={() => openLightbox(i)}
        />
      )
      if (imgEmbed.images.length === 4) {
        return (
          <View style={styles.imagesContainer}>
            <View style={styles.imagePair}>
              <Thumb i={0} style={styles.imagePairItem} />
              <View style={styles.imagesWidthSpacer} />
              <Thumb i={1} style={styles.imagePairItem} />
            </View>
            <View style={styles.imagesHeightSpacer} />
            <View style={styles.imagePair}>
              <Thumb i={2} style={styles.imagePairItem} />
              <View style={styles.imagesWidthSpacer} />
              <Thumb i={3} style={styles.imagePairItem} />
            </View>
          </View>
        )
      } else if (imgEmbed.images.length === 3) {
        return (
          <View style={styles.imagesContainer}>
            <View style={styles.imageWide}>
              <Thumb i={0} style={styles.imageWideItem} />
            </View>
            <View style={styles.imagesHeightSpacer} />
            <View style={styles.imagePair}>
              <Thumb i={1} style={styles.imagePairItem} />
              <View style={styles.imagesWidthSpacer} />
              <Thumb i={2} style={styles.imagePairItem} />
            </View>
          </View>
        )
      } else if (imgEmbed.images.length === 2) {
        return (
          <View style={styles.imagesContainer}>
            <View style={styles.imagePair}>
              <Thumb i={0} style={styles.imagePairItem} />
              <View style={styles.imagesWidthSpacer} />
              <Thumb i={1} style={styles.imagePairItem} />
            </View>
          </View>
        )
      } else {
        return (
          <View style={styles.imagesContainer}>
            <View style={styles.imageBig}>
              <Thumb i={0} style={styles.imageBigItem} />
            </View>
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
          <AutoSizedImage style={style} uri={link.thumb} />
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
    marginBottom: 6,
  },
  imagesWidthSpacer: {
    width: 5,
  },
  imagesHeightSpacer: {
    height: 5,
  },
  imagePair: {
    flexDirection: 'row',
  },
  imagePairItem: {
    resizeMode: 'contain',
    flex: 1,
    borderRadius: 4,
  },
  imageWide: {},
  imageWideItem: {
    resizeMode: 'contain',
    borderRadius: 4,
  },
  imageBig: {},
  imageBigItem: {
    borderRadius: 4,
  },

  extOuter: {
    borderRadius: 8,
    padding: 10,
  },
  extDescription: {
    marginTop: 4,
  },
})
