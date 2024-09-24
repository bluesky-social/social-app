import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {parseTenorGif} from '#/lib/strings/embed-player'
import {atoms as a, useTheme} from '#/alf'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'

/**
 * Streamlined MediaPreview component which just handles images, gifs, and videos
 */
export function Embed({
  embed,
  style,
}: {
  embed?:
    | AppBskyEmbedImages.View
    | AppBskyEmbedRecordWithMedia.View
    | AppBskyEmbedExternal.View
    | AppBskyEmbedVideo.View
    | {[k: string]: unknown}
  style?: StyleProp<ViewStyle>
}) {
  let media = AppBskyEmbedRecordWithMedia.isView(embed) ? embed.media : embed

  if (AppBskyEmbedImages.isView(media)) {
    return (
      <Outer style={style}>
        {media.images.map(image => (
          <ImageItem
            key={image.thumb}
            thumbnail={image.thumb}
            alt={image.alt}
          />
        ))}
      </Outer>
    )
  } else if (AppBskyEmbedExternal.isView(media) && media.external.thumb) {
    let url: URL | undefined
    try {
      url = new URL(media.external.uri)
    } catch {}
    if (url) {
      const {success} = parseTenorGif(url)
      if (success) {
        return (
          <Outer style={style}>
            <GifItem
              thumbnail={media.external.thumb}
              alt={media.external.title}
            />
          </Outer>
        )
      }
    }
  } else if (AppBskyEmbedVideo.isView(media)) {
    return (
      <Outer style={style}>
        <VideoItem thumbnail={media.thumbnail} alt={media.alt} />
      </Outer>
    )
  }

  return null
}

export function Outer({
  children,
  style,
}: {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return <View style={[a.flex_row, a.gap_xs, style]}>{children}</View>
}

export function ImageItem({
  thumbnail,
  alt,
  children,
}: {
  thumbnail: string
  alt?: string
  children?: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View style={[a.relative, a.flex_1, {aspectRatio: 1, maxWidth: 100}]}>
      <Image
        key={thumbnail}
        source={{uri: thumbnail}}
        style={[a.flex_1, a.rounded_xs, t.atoms.bg_contrast_25]}
        contentFit="cover"
        accessible={true}
        accessibilityIgnoresInvertColors
        accessibilityHint={alt}
        accessibilityLabel=""
      />
      <MediaInsetBorder style={[a.rounded_xs]} />
      {children}
    </View>
  )
}

export function GifItem({thumbnail, alt}: {thumbnail: string; alt?: string}) {
  return (
    <ImageItem thumbnail={thumbnail} alt={alt}>
      <View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
        <PlayButtonIcon size={24} />
      </View>
      <View style={styles.altContainer}>
        <Text style={styles.alt}>
          <Trans>GIF</Trans>
        </Text>
      </View>
    </ImageItem>
  )
}

export function VideoItem({
  thumbnail,
  alt,
}: {
  thumbnail?: string
  alt?: string
}) {
  if (!thumbnail) {
    return (
      <View
        style={[
          {backgroundColor: 'black'},
          a.flex_1,
          {aspectRatio: 1, maxWidth: 100},
          a.justify_center,
          a.align_center,
        ]}>
        <PlayButtonIcon size={24} />
      </View>
    )
  }
  return (
    <ImageItem thumbnail={thumbnail} alt={alt}>
      <View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
        <PlayButtonIcon size={24} />
      </View>
    </ImageItem>
  )
}

const styles = StyleSheet.create({
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    right: 5,
    bottom: 5,
    zIndex: 2,
  },
  alt: {
    color: 'white',
    fontSize: 7,
    fontWeight: '600',
  },
})
