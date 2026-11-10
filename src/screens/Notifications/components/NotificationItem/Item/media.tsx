import {type StyleProp, View, type ViewStyle} from 'react-native'
import {moderatePost} from '@bsky/sdk/moderation'
import {Trans} from '@lingui/react/macro'

import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {getRowBorderColor, useItemContext} from './Root'

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
 * Outlined container for compact previews of feeds and starter packs. Its
 * border is the one the same embeds have in a post, but
 * for the dark theme's unread tint, see `getRowBorderColor`. It is
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
        {borderColor: getRowBorderColor(t, !isRead)},
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
