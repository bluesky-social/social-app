import React from 'react'
import {
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
  Image as RNImage,
} from 'react-native'
import {
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
} from '@atproto/api'
import {Link} from '../Link'
import {AutoSizedImage} from '../images/AutoSizedImage'
import {ImageLayoutGrid} from '../images/ImageLayoutGrid'
import {ImagesLightbox} from 'state/models/ui/shell'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {saveImageModal} from 'lib/media/manip'
import {YoutubeEmbed} from './YoutubeEmbed'
import {ExternalLinkEmbed} from './ExternalLinkEmbed'
import {getYoutubeVideoId} from 'lib/strings/url-helpers'
import QuoteEmbed from './QuoteEmbed'

type Embed =
  | AppBskyEmbedRecord.View
  | AppBskyEmbedImages.View
  | AppBskyEmbedExternal.View
  | AppBskyEmbedRecordWithMedia.View
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

  if (
    AppBskyEmbedRecordWithMedia.isView(embed) &&
    AppBskyEmbedRecord.isViewRecord(embed.record.record) &&
    AppBskyFeedPost.isRecord(embed.record.record.value) &&
    AppBskyFeedPost.validateRecord(embed.record.record.value).success
  ) {
    return (
      <View style={[styles.stackContainer, style]}>
        <PostEmbeds embed={embed.media} />
        <QuoteEmbed
          quote={{
            author: embed.record.record.author,
            cid: embed.record.record.cid,
            uri: embed.record.record.uri,
            indexedAt: embed.record.record.indexedAt,
            text: embed.record.record.value.text,
            embeds: embed.record.record.embeds,
          }}
        />
      </View>
    )
  }

  if (AppBskyEmbedRecord.isView(embed)) {
    if (
      AppBskyEmbedRecord.isViewRecord(embed.record) &&
      AppBskyFeedPost.isRecord(embed.record.value) &&
      AppBskyFeedPost.validateRecord(embed.record.value).success
    ) {
      return (
        <QuoteEmbed
          quote={{
            author: embed.record.author,
            cid: embed.record.cid,
            uri: embed.record.uri,
            indexedAt: embed.record.indexedAt,
            text: embed.record.value.text,
            embeds: embed.record.embeds,
          }}
          style={style}
        />
      )
    }
  }

  if (AppBskyEmbedImages.isView(embed)) {
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
            <AutoSizedImage
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

  if (AppBskyEmbedExternal.isView(embed)) {
    const link = embed.external
    const youtubeVideoId = getYoutubeVideoId(link.uri)

    if (youtubeVideoId) {
      return <YoutubeEmbed link={link} style={style} />
    }

    return (
      <Link
        style={[styles.extOuter, pal.view, pal.border, style]}
        href={link.uri}
        noFeedback>
        <ExternalLinkEmbed link={link} />
      </Link>
    )
  }
  return <View />
}

const styles = StyleSheet.create({
  stackContainer: {
    gap: 6,
  },
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
})
