import React from 'react'
import {
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
  Text,
  InteractionManager,
} from 'react-native'
import {Image} from 'expo-image'
import {
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  ModerationUI,
  PostModeration,
} from '@atproto/api'
import {Link} from '../Link'
import {ImageLayoutGrid} from '../images/ImageLayoutGrid'
import {useLightboxControls, ImagesLightbox} from '#/state/lightbox'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {YoutubeEmbed} from './YoutubeEmbed'
import {ExternalLinkEmbed} from './ExternalLinkEmbed'
import {getYoutubeVideoId} from 'lib/strings/url-helpers'
import {MaybeQuoteEmbed} from './QuoteEmbed'
import {AutoSizedImage} from '../images/AutoSizedImage'
import {ListEmbed} from './ListEmbed'
import {isCauseALabelOnUri, isQuoteBlurred} from 'lib/moderation'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {ContentHider} from '../moderation/ContentHider'

type Embed =
  | AppBskyEmbedRecord.View
  | AppBskyEmbedImages.View
  | AppBskyEmbedExternal.View
  | AppBskyEmbedRecordWithMedia.View
  | {$type: string; [k: string]: unknown}

export function PostEmbeds({
  embed,
  moderation,
  moderationDecisions,
  style,
}: {
  embed?: Embed
  moderation: ModerationUI
  moderationDecisions?: PostModeration['decisions']
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const {openLightbox} = useLightboxControls()
  const {isMobile} = useWebMediaQueries()

  // quote post with media
  // =
  if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    const isModOnQuote =
      (AppBskyEmbedRecord.isViewRecord(embed.record.record) &&
        isCauseALabelOnUri(moderation.cause, embed.record.record.uri)) ||
      (moderationDecisions && isQuoteBlurred(moderationDecisions))
    const mediaModeration = isModOnQuote ? {} : moderation
    const quoteModeration = isModOnQuote ? moderation : {}
    return (
      <View style={[styles.stackContainer, style]}>
        <PostEmbeds embed={embed.media} moderation={mediaModeration} />
        <ContentHider moderation={quoteModeration}>
          <MaybeQuoteEmbed embed={embed.record} moderation={quoteModeration} />
        </ContentHider>
      </View>
    )
  }

  if (AppBskyEmbedRecord.isView(embed)) {
    // custom feed embed (i.e. generator view)
    // =
    if (AppBskyFeedDefs.isGeneratorView(embed.record)) {
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
      return <ListEmbed item={embed.record} />
    }

    // quote post
    // =
    return (
      <MaybeQuoteEmbed embed={embed} style={style} moderation={moderation} />
    )
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
          <View style={[styles.imagesContainer, style]}>
            <AutoSizedImage
              alt={alt}
              uri={thumb}
              dimensionsHint={aspectRatio}
              onPress={() => _openLightbox(0)}
              onPressIn={() => onPressIn(0)}
              style={[
                styles.singleImage,
                isMobile && styles.singleImageMobile,
              ]}>
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
            onPress={_openLightbox}
            onPressIn={onPressIn}
            style={
              embed.images.length === 1
                ? [styles.singleImage, isMobile && styles.singleImageMobile]
                : undefined
            }
          />
        </View>
      )
    }
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
    maxHeight: 1000,
  },
  singleImageMobile: {
    maxHeight: 500,
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
  customFeedOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
