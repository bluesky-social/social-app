import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {moderatePost} from '@bsky/sdk/moderation'
import {Trans} from '@lingui/react/macro'

import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {IS_WEB} from '#/env'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {useItemContext} from './Root'

type Thumbnail = {
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
 * Thumbnails for the images, video or GIF attached to a post, including the
 * media half of a record-with-media embed. Other links have none.
 */
export function getPostThumbnails(
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
 * thumbnails, per `getPostThumbnails`.
 */
export function InlineImages({
  embed,
  size,
  blurred = false,
  style,
}: {
  embed: app.bsky.feed.defs.PostView['embed']
  /**
   * The square's width and height.
   */
  size: number
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
 * Corner radius of an `InlineImages` tile: rounded where the corner is on the
 * outside of the grid, tight where it meets another tile.
 */
function cornerRadius(isOuter: boolean) {
  return isOuter ? tokens.borderRadius.md : tokens.borderRadius._2xs
}

/**
 * Outlined container for compact previews of feeds, starter packs, links and
 * quoted posts. Its border is the one the same embeds have in a post. It is
 * transparent on the unread tint, so it doesn't punch a white hole in the row.
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
        t.atoms.border_contrast_low,
        isRead && t.atoms.bg,
        style,
      ]}>
      {children}
    </View>
  )
}

/**
 * Compact, non-interactive card for a feed generator: its avatar, name, and
 * creator.
 */
export function FeedCard({
  generator,
}: {
  generator: app.bsky.feed.defs.GeneratorView
}) {
  const t = useTheme()
  const handle = sanitizeHandle(generator.creator.handle, '@')

  return (
    <Card>
      <View style={[a.flex_row, a.align_start, a.gap_sm]}>
        <UserAvatar
          type="algo"
          size={32}
          avatar={generator.avatar}
          extraAviStyle={{borderRadius: tokens.borderRadius.sm}}
        />
        <View style={[a.flex_1]}>
          <Text
            emoji
            numberOfLines={1}
            style={[a.text_md, a.leading_snug, a.font_semi_bold]}>
            {generator.displayName}
          </Text>
          <Text
            emoji
            numberOfLines={1}
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_high]}>
            <Trans>Feed by {handle}</Trans>
          </Text>
        </View>
      </View>
    </Card>
  )
}
