import {View} from 'react-native'

import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

/** Below this size, the standard corner radius looks too round. */
const SMALL_SIZE = 28

export function PublicationIcon({
  view,
  size,
}: {
  view: app.bsky.embed.external.ViewArticlePublication
  size: number
  interacted?: boolean
}) {
  const t = useTheme()
  const theme = getPublicationTheme(view)
  const rounded = size < SMALL_SIZE ? a.rounded_xs : a.rounded_sm
  return view.logo ? (
    <View>
      <UserAvatar
        noBorder
        type="labeler"
        size={size}
        avatar={view.logo}
        extraAviStyle={rounded}
      />
      <MediaInsetBorder opaque style={[rounded]} />
    </View>
  ) : (
    <View
      style={[
        a.align_center,
        a.justify_center,
        rounded,
        {
          width: size,
          height: size,
          backgroundColor: theme?.accent ?? t.atoms.text.color,
        },
      ]}>
      <Text
        emoji
        style={[
          a.text_xl,
          a.font_bold,
          {color: theme?.accentForeground ?? t.atoms.text_inverted.color},
        ]}>
        {[...view.title][0] ?? ''}
      </Text>
      <MediaInsetBorder opaque style={[rounded]} />
    </View>
  )
}
