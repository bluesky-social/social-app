import React from 'react'
import {
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
  Image as RNImage,
} from 'react-native'
import {AppBskyEmbedImages, AppBskyEmbedExternal} from '@atproto/api'
import LinearGradient from 'react-native-linear-gradient'
import {Link} from '../util/Link'
import {Text} from './text/Text'
import {Image} from './images/Image'
import {ImageLayoutGrid} from './images/ImageLayoutGrid'
import {ImagesLightbox} from '../../../state/models/shell-ui'
import {useStores} from '../../../state'
import {usePalette} from '../../lib/hooks/usePalette'
import {gradients} from '../../lib/styles'
import {saveImageModal} from '../../../lib/images'

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
      const onLongPress = (index: number) => {
        saveImageModal({uri: uris[index]})
      }
      const onPressIn = (index: number) => {
        const firstImageToShow = uris[index]
        RNImage.prefetch(firstImageToShow)
        uris.forEach(uri => {
          if (firstImageToShow !== uri) {
            // First image already prefeched above
            RNImage.prefetch(uri)
          }
        })
      }

      if (embed.images.length === 4) {
        return (
          <View style={[styles.imagesContainer, style]}>
            <ImageLayoutGrid
              type="four"
              uris={embed.images.map(img => img.thumb)}
              onPress={openLightbox}
              onLongPress={onLongPress}
              onPressIn={onPressIn}
            />
          </View>
        )
      } else if (embed.images.length === 3) {
        return (
          <View style={[styles.imagesContainer, style]}>
            <ImageLayoutGrid
              type="three"
              uris={embed.images.map(img => img.thumb)}
              onPress={openLightbox}
              onLongPress={onLongPress}
              onPressIn={onPressIn}
            />
          </View>
        )
      } else if (embed.images.length === 2) {
        return (
          <View style={[styles.imagesContainer, style]}>
            <ImageLayoutGrid
              type="two"
              uris={embed.images.map(img => img.thumb)}
              onPress={openLightbox}
              onLongPress={onLongPress}
              onPressIn={onPressIn}
            />
          </View>
        )
      } else {
        return (
          <View style={[styles.imagesContainer, style]}>
            <Image
              uri={embed.images[0].thumb}
              onPress={() => openLightbox(0)}
              onLongPress={() => onLongPress(0)}
              onPressIn={() => onPressIn(0)}
              style={styles.singleImage}
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
          <Image uri={link.thumb} style={styles.extImage} />
        ) : (
          <LinearGradient
            colors={[gradients.blueDark.start, gradients.blueDark.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.extImage, styles.extImageFallback]}
          />
        )}
        <View style={styles.extInner}>
          <Text type="md-bold" numberOfLines={2} style={[pal.text]}>
            {link.title || link.uri}
          </Text>
          <Text
            type="sm"
            numberOfLines={1}
            style={[pal.textLight, styles.extUri]}>
            {link.uri}
          </Text>
          {link.description ? (
            <Text
              type="sm"
              numberOfLines={2}
              style={[pal.text, styles.extDescription]}>
              {link.description}
            </Text>
          ) : undefined}
        </View>
      </Link>
    )
  }
  return <View />
}

const styles = StyleSheet.create({
  imagesContainer: {
    marginTop: 4,
  },
  singleImage: {
    borderRadius: 8,
    maxHeight: 500,
  },
  extOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  extInner: {
    padding: 10,
  },
  extImage: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
    maxHeight: 200,
  },
  extImageFallback: {
    height: 160,
  },
  extUri: {
    marginTop: 2,
  },
  extDescription: {
    marginTop: 4,
  },
})
