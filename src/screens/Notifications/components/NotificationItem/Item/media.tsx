import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {moderatePost} from '@bsky/sdk/moderation'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, tokens, useTheme} from '#/alf'
import {IS_WEB} from '#/env'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {useItemContext} from './Root'

type Thumbnail = {
  uri: string
  alt: string
}

/**
 * Blur for thumbnails whose media is behind a moderation warning. On web
 * this is a CSS blur in pixels, so a native-sized radius would wash out the
 * small tiles entirely.
 */
const BLUR_RADIUS = IS_WEB ? 10 : 100

/**
 * Whether a post's media should be blurred, per its labels and the viewer's
 * moderation settings (e.g. adult content or graphic media).
 */
export function usePostMediaBlurred(post: app.bsky.feed.defs.PostView) {
  const moderationOpts = useModerationOpts()
  return moderationOpts
    ? moderatePost(post, moderationOpts).ui('contentMedia').blur
    : false
}

/**
 * Image and video thumbnails attached to a post, including the media half of
 * a record-with-media embed.
 */
export function getPostThumbnails(
  embed: app.bsky.feed.defs.PostView['embed'],
): Thumbnail[] {
  const media = bsky.isType(app.bsky.embed.recordWithMedia.view, embed)
    ? embed.media
    : embed

  if (bsky.isType(app.bsky.embed.images.view, media)) {
    return media.images.map(image => ({uri: image.thumb, alt: image.alt}))
  }
  if (bsky.isType(app.bsky.embed.gallery.view, media)) {
    return media.items.flatMap(item =>
      bsky.isType(app.bsky.embed.gallery.viewImage, item)
        ? [{uri: item.thumbnail, alt: item.alt}]
        : [],
    )
  }
  if (bsky.isType(app.bsky.embed.video.view, media) && media.thumbnail) {
    return [{uri: media.thumbnail, alt: media.alt ?? ''}]
  }
  return []
}

/**
 * A compact square preview of a post's images: one image fills the square,
 * two sit side by side, and three or more form a 2x2 grid. Renders nothing if
 * the post has no images.
 */
export function InlineImages({
  embed,
  size,
  blurred = false,
  style,
}: {
  embed: app.bsky.feed.defs.PostView['embed']
  /**
   * 60 for a trailing preview, 80 when the images stand in for post text.
   */
  size: 60 | 80
  /**
   * Heavily blurs the thumbnails, for media behind a moderation warning. Get
   * this from `usePostMediaBlurred`, or from the post's `contentMedia`
   * moderation UI.
   */
  blurred?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const thumbnails = getPostThumbnails(embed).slice(0, 4)

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
                key={thumbnail.uri}
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
                  source={{uri: thumbnail.uri}}
                  accessibilityIgnoresInvertColors
                  // Alt text could describe what the blur is hiding
                  accessibilityLabel={blurred ? undefined : thumbnail.alt}
                  accessibilityHint=""
                  blurRadius={blurred ? BLUR_RADIUS : 0}
                  style={[a.flex_1, t.atoms.bg_contrast_25]}
                  contentFit="cover"
                />
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

/**
 * Corner radius of an `InlineImages` tile: rounded where the corner is on the
 * outside of the grid, tight where it meets another tile.
 */
function cornerRadius(isOuter: boolean) {
  return isOuter ? tokens.borderRadius.md : tokens.borderRadius._2xs
}

/**
 * Outlined container for compact previews of feeds, starter packs, links and
 * quoted posts. Transparent on the unread tint, so it doesn't punch a white
 * hole in the row.
 */
export function Card({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const t = useTheme()
  const {isRead} = useItemContext()

  return (
    <View
      style={[
        a.p_md,
        a.rounded_md,
        a.curve_continuous,
        a.border,
        t.atoms.border_contrast_high,
        isRead && t.atoms.bg,
        style,
      ]}>
      {children}
    </View>
  )
}
