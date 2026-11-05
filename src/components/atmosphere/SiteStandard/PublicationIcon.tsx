import {View} from 'react-native'

import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {StandardSite} from '#/components/icons/community/StandardSite'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

const PUBLICATION_AVATAR_STYLE = {
  borderRadius: a.rounded_sm.borderRadius,
}

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
  const icon = view.logo ? (
    <View>
      <UserAvatar
        noBorder
        type="labeler"
        size={size}
        avatar={view.logo}
        extraAviStyle={PUBLICATION_AVATAR_STYLE}
      />
      <MediaInsetBorder opaque style={[a.rounded_sm]} />
    </View>
  ) : (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_sm,
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
      <MediaInsetBorder opaque style={[a.rounded_sm]} />
    </View>
  )
  return (
    <View style={[a.relative]}>
      <View
        style={[
          a.absolute,
          a.rounded_full,
          a.z_10,
          a.justify_center,
          a.align_center,
          t.atoms.bg,
          {
            width: 16,
            height: 16,
            top: -6,
            left: -6,
          },
        ]}>
        <StandardSite size="xs" fill={t.atoms.text_contrast_medium.color} />
        <MediaInsetBorder />
      </View>
      {icon}
    </View>
  )
}
