import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'

import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {atoms as a, tokens, useTheme} from '#/alf'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {IS_WEB} from '#/env'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type Thumbnail = {
  /**
   * Missing for a video or GIF without a thumbnail, which still gets a tile.
   */
  uri: string | undefined
  alt: string
  /**
   * Videos and GIFs, which get a play button over the thumbnail.
   */
  isPlayable: boolean
}

/**
 * Blur for thumbnails whose media is behind a moderation warning. On web
 * this is a CSS blur in pixels, so a native-sized radius would wash out the
 * small tiles entirely.
 */
const BLUR_RADIUS = IS_WEB ? 10 : 100

/**
 * Thumbnails for the images, video or GIF attached to a post, including the
 * media half of a record-with-media embed. Other links have none.
 */
export function getEmbedThumbnails(
  embed: app.bsky.feed.defs.PostView['embed'],
): Thumbnail[] {
  const media = bsky.isType(app.bsky.embed.recordWithMedia.view, embed)
    ? embed.media
    : embed

  if (bsky.isType(app.bsky.embed.images.view, media)) {
    return media.images.map(image => ({
      uri: image.thumb,
      alt: image.alt,
      isPlayable: false,
    }))
  }
  if (bsky.isType(app.bsky.embed.gallery.view, media)) {
    return media.items.flatMap(item =>
      bsky.isType(app.bsky.embed.gallery.viewImage, item)
        ? [{uri: item.thumbnail, alt: item.alt, isPlayable: false}]
        : [],
    )
  }
  if (bsky.isType(app.bsky.embed.video.view, media)) {
    return [{uri: media.thumbnail, alt: media.alt ?? '', isPlayable: true}]
  }
  if (
    bsky.isType(app.bsky.embed.external.view, media) &&
    parseEmbedPlayerFromUrl(media.external.uri)?.isGif
  ) {
    return [
      {
        uri: media.external.thumb,
        alt: parseAltFromGIFDescription(media.external.description).alt,
        isPlayable: true,
      },
    ]
  }
  return []
}

/**
 * A compact square preview of a post's media: one image, video or GIF fills
 * the square, two sit side by side, and three or more form a 2x2 grid.
 * Videos and GIFs get a play button. Renders nothing if the post has no
 * thumbnails, per `getEmbedThumbnails`.
 */
export function CompactMedia({
  embed,
  size,
  blurred = false,
  style,
}: {
  embed: app.bsky.feed.defs.PostView['embed']
  /**
   * 120 beside a compact quote's text, 80 when the media stands in for a
   * post's text, or 60 trailing a notification.
   */
  size: 60 | 80 | 120
  /**
   * Heavily blurs the thumbnails, for media behind a moderation warning that
   * can't be revealed in place.
   */
  blurred?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const thumbnails = getEmbedThumbnails(embed).slice(0, 4)

  if (thumbnails.length === 0) return null

  // Columns, then rows, of thumbnails
  const columns =
    thumbnails.length === 1
      ? [[thumbnails[0]]]
      : thumbnails.length === 2
        ? [[thumbnails[0]], [thumbnails[1]]]
        : [
            [thumbnails[0], thumbnails[2]],
            [thumbnails[1], thumbnails[3]].filter(Boolean),
          ]

  return (
    <View
      accessible={false}
      style={[a.flex_row, {width: size, height: size, gap: 1}, style]}>
      {columns.map((column, columnIndex) => (
        <View key={columnIndex} style={[a.flex_1, {gap: 1}]}>
          {column.map((thumbnail, rowIndex) => {
            const isLeft = columnIndex === 0
            const isRight = columnIndex === columns.length - 1
            const isTop = rowIndex === 0
            const isBottom = rowIndex === column.length - 1
            return (
              <View
                key={`${columnIndex}-${rowIndex}`}
                style={[
                  a.flex_1,
                  a.overflow_hidden,
                  a.curve_continuous,
                  a.border,
                  t.atoms.border_contrast_low,
                  // Rounded on the outside of the grid, tight between tiles
                  {
                    borderTopLeftRadius: cornerRadius(isTop && isLeft),
                    borderTopRightRadius: cornerRadius(isTop && isRight),
                    borderBottomLeftRadius: cornerRadius(isBottom && isLeft),
                    borderBottomRightRadius: cornerRadius(isBottom && isRight),
                  },
                ]}>
                <Image
                  source={thumbnail.uri ? {uri: thumbnail.uri} : undefined}
                  accessibilityIgnoresInvertColors
                  // Alt text could describe what the blur is hiding
                  accessibilityLabel={blurred ? undefined : thumbnail.alt}
                  accessibilityHint=""
                  blurRadius={blurred ? BLUR_RADIUS : 0}
                  style={[a.flex_1, t.atoms.bg_contrast_25]}
                  contentFit="cover"
                />
                {thumbnail.isPlayable && (
                  <View
                    style={[
                      a.absolute,
                      a.inset_0,
                      a.align_center,
                      a.justify_center,
                    ]}>
                    <PlayButtonIcon size={size / 4} />
                  </View>
                )}
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

/**
 * Corner radius of a `CompactMedia` tile: rounded where the corner is on the
 * outside of the grid, tight where it meets another tile.
 */
function cornerRadius(isOuter: boolean) {
  return isOuter ? tokens.borderRadius.md : tokens.borderRadius._2xs
}
