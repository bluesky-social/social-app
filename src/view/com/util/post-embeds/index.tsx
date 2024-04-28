import React from 'react'
import {
  InteractionManager,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import {Image} from 'expo-image'
import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  ModerationDecision,
} from '@atproto/api'

import {ImagesLightbox, useLightboxControls} from '#/state/lightbox'
import {usePalette} from 'lib/hooks/usePalette'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {ContentHider} from '../../../../components/moderation/ContentHider'
import {AutoSizedImage} from '../images/AutoSizedImage'
import {ImageLayoutGrid} from '../images/ImageLayoutGrid'
import {ExternalLinkEmbed} from './ExternalLinkEmbed'
import {ListEmbed} from './ListEmbed'
import {MaybeQuoteEmbed} from './QuoteEmbed'

type Embed =
  | AppBskyEmbedRecord.View
  | AppBskyEmbedImages.View
  | AppBskyEmbedExternal.View
  | AppBskyEmbedRecordWithMedia.View
  | {$type: string; [k: string]: unknown}

export function PostEmbeds({
  embed,
  moderation,
  style,
}: {
  embed?: Embed
  moderation?: ModerationDecision
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const {openLightbox} = useLightboxControls()

  // quote post with media
  // =
  if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    return (
      <View style={style}>
        <PostEmbeds embed={embed.media} moderation={moderation} />
        <MaybeQuoteEmbed embed={embed.record} />
      </View>
    )
  }

  if (AppBskyEmbedRecord.isView(embed)) {
    // custom feed embed (i.e. generator view)
    // =
    if (AppBskyFeedDefs.isGeneratorView(embed.record)) {
      // TODO moderation
      return (
        <FeedSourceCard
          feedUri={embed.record.uri}
          style={[pal.view, pal.border, styles.customFeedOuter]}
          showLikes
        />
      )
    }

    // list embed
    if (AppBskyGraphDefs.isListView(embed.record)) {
      // TODO moderation
      return <ListEmbed item={embed.record} />
    }

    // quote post
    // =
    return <MaybeQuoteEmbed embed={embed} style={style} />
  }

  // image embed
  // =
  if (AppBskyEmbedImages.isView(embed)) {
    const {images} = embed

    if (images.length > 0) {
      const items = embed.images.map(img => ({
        uri: img.fullsize,
        alt: img.alt,
        aspectRatio: img.aspectRatio,
      }))
      const _openLightbox = (index: number) => {
        openLightbox(new ImagesLightbox(items, index))
      }
      const onPressIn = (_: number) => {
        InteractionManager.runAfterInteractions(() => {
          Image.prefetch(items.map(i => i.uri))
        })
      }

      if (images.length === 1) {
        const {alt, thumb, aspectRatio} = images[0]
        return (
          <ContentHider modui={moderation?.ui('contentMedia')}>
            <View style={[styles.imagesContainer, style]}>
              <AutoSizedImage
                alt={alt}
                uri={thumb}
                dimensionsHint={aspectRatio}
                onPress={() => _openLightbox(0)}
                onPressIn={() => onPressIn(0)}
                style={[styles.singleImage]}>
                {alt === '' ? null : (
                  <View style={styles.altContainer}>
                    <Text style={styles.alt} accessible={false}>
                      ALT
                    </Text>
                  </View>
                )}
              </AutoSizedImage>
            </View>
          </ContentHider>
        )
      }

      return (
        <ContentHider modui={moderation?.ui('contentMedia')}>
          <View style={[styles.imagesContainer, style]}>
            <ImageLayoutGrid
              images={embed.images}
              onPress={_openLightbox}
              onPressIn={onPressIn}
              style={
                embed.images.length === 1 ? [styles.singleImage] : undefined
              }
            />
          </View>
        </ContentHider>
      )
    }
  }

  // external link embed
  // =
  if (AppBskyEmbedExternal.isView(embed)) {
    const link = embed.external
    return (
      <ContentHider modui={moderation?.ui('contentMedia')}>
        <ExternalLinkEmbed link={link} style={style} />
      </ContentHider>
    )
  }

  return <View />
}

const styles = StyleSheet.create({
  imagesContainer: {
    marginTop: 8,
  },
  singleImage: {
    borderRadius: 8,
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
  customFeedOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
