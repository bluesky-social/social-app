import {type StyleProp, StyleSheet, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyFeedDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {isTenorGifUri} from '#/lib/strings/embed-player'
import {atoms as a, useTheme} from '#/alf'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import * as bsky from '#/types/bsky'

/**
 * Streamlined MediaPreview component which just handles images, gifs, and videos
 */
export function Embed({
  embed,
  style,
}: {
  embed: AppBskyFeedDefs.PostView['embed']
  style?: StyleProp<ViewStyle>
}) {
  const e = bsky.post.parseEmbed(embed)

  if (!e) return null

  if (e.type === 'images') {
    return (
      <Outer style={style}>
        {e.view.images.map(image => (
          <ImageItem
            key={image.thumb}
            thumbnail={image.thumb}
            alt={image.alt}
          />
        ))}
      </Outer>
    )
  } else if (e.type === 'link') {
    if (!e.view.external.thumb) return null
    if (!isTenorGifUri(e.view.external.uri)) return null
    return (
      <Outer style={style}>
        <GifItem
          thumbnail={e.view.external.thumb}
          alt={e.view.external.title}
        />
      </Outer>
    )
  } else if (e.type === 'video') {
    return (
      <Outer style={style}>
        {e.view.presentation === 'gif' ? (
          <GifItem thumbnail={e.view.thumbnail} alt={e.view.alt} />
        ) : (
          <VideoItem thumbnail={e.view.thumbnail} alt={e.view.alt} />
        )}
      </Outer>
    )
  } else if (
    e.type === 'post_with_media' &&
    // ignore further "nested" RecordWithMedia
    e.media.type !== 'post_with_media' &&
    // ignore any unknowns
    e.media.view !== null
  ) {
    return <Embed embed={e.media.view} style={style} />
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
  thumbnail?: string
  alt?: string
  children?: React.ReactNode
}) {
  const t = useTheme()

  if (!thumbnail) {
    return (
      <View
        style={[
          {backgroundColor: 'black'},
          a.flex_1,
          a.aspect_square,
          {maxWidth: 100},
          a.rounded_xs,
        ]}
        accessibilityLabel={alt}
        accessibilityHint="">
        {children}
      </View>
    )
  }

  return (
    <View style={[a.relative, a.flex_1, a.aspect_square, {maxWidth: 100}]}>
      <Image
        key={thumbnail}
        source={{uri: thumbnail}}
        alt={alt}
        style={[a.flex_1, a.rounded_xs, t.atoms.bg_contrast_25]}
        contentFit="cover"
        accessible={true}
        accessibilityIgnoresInvertColors
      />
      <MediaInsetBorder style={[a.rounded_xs]} />
      {children}
    </View>
  )
}

export function GifItem({thumbnail, alt}: {thumbnail?: string; alt?: string}) {
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
    left: 5,
    bottom: 5,
    zIndex: 2,
  },
  alt: {
    color: 'white',
    fontSize: 7,
    fontWeight: '600',
  },
})
