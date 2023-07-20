import React from 'react'
import {
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
  Image as RNImage,
  Text,
} from 'react-native'
import {
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
} from '@atproto/api'
import {Link} from '../Link'
import {ImageLayoutGrid} from '../images/ImageLayoutGrid'
import {ImagesLightbox} from 'state/models/ui/shell'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {YoutubeEmbed} from './YoutubeEmbed'
import {ExternalLinkEmbed} from './ExternalLinkEmbed'
import {getYoutubeVideoId} from 'lib/strings/url-helpers'
import QuoteEmbed from './QuoteEmbed'
import {AutoSizedImage} from '../images/AutoSizedImage'
import {CustomFeedEmbed} from './CustomFeedEmbed'
import {ListEmbed} from './ListEmbed'
import {isDesktopWeb} from 'platform/detection'

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

  // quote post with media
  // =
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

  // quote post
  // =
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

  // image embed
  // =
  if (AppBskyEmbedImages.isView(embed)) {
    const {images} = embed

    if (images.length > 0) {
      const items = embed.images.map(img => ({uri: img.fullsize, alt: img.alt}))
      const openLightbox = (index: number) => {
        store.shell.openLightbox(new ImagesLightbox(items, index))
      }
      const onPressIn = (index: number) => {
        const firstImageToShow = items[index].uri
        RNImage.prefetch(firstImageToShow)
        items.forEach(item => {
          if (firstImageToShow !== item.uri) {
            // First image already prefetched above
            RNImage.prefetch(item.uri)
          }
        })
      }

      if (images.length === 1) {
        const {alt, thumb} = images[0]
        return (
          <View style={[styles.imagesContainer, style]}>
            <AutoSizedImage
              alt={alt}
              uri={thumb}
              onPress={() => openLightbox(0)}
              onPressIn={() => onPressIn(0)}
              style={styles.singleImage}>
              {alt === '' ? null : (
                <View style={styles.altContainer}>
                  <Text style={styles.alt} accessible={false}>
                    ALT
                  </Text>
                </View>
              )}
            </AutoSizedImage>
          </View>
        )
      }

      return (
        <View style={[styles.imagesContainer, style]}>
          <ImageLayoutGrid
            images={embed.images}
            onPress={openLightbox}
            onPressIn={onPressIn}
            style={embed.images.length === 1 ? styles.singleImage : undefined}
          />
        </View>
      )
    }
  }

  // custom feed embed (i.e. generator view)
  // =
  if (
    AppBskyEmbedRecord.isView(embed) &&
    AppBskyFeedDefs.isGeneratorView(embed.record)
  ) {
    return <CustomFeedEmbed record={embed.record} />
  }

  // list embed (e.g. mute lists; i.e. ListView)
  if (
    AppBskyEmbedRecord.isView(embed) &&
    AppBskyGraphDefs.isListView(embed.record)
  ) {
    return <ListEmbed item={embed.record} />
  }

  // external link embed
  // =
  if (AppBskyEmbedExternal.isView(embed)) {
    const link = embed.external
    const youtubeVideoId = getYoutubeVideoId(link.uri)

    if (youtubeVideoId) {
      return <YoutubeEmbed link={link} style={style} />
    }

    return (
      <Link
        asAnchor
        noFeedback
        style={[styles.extOuter, pal.view, pal.border, style]}
        href={link.uri}>
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
    marginTop: 8,
  },
  singleImage: {
    borderRadius: 8,
    maxHeight: isDesktopWeb ? 1000 : 500,
  },
  extOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    left: 6,
    bottom: 6,
  },
  alt: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
})
