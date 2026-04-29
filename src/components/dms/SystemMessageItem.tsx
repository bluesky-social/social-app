import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {type ConvoItem} from '#/state/messages/convo/types'
import {atoms as a, useTheme} from '#/alf'
import {getSystemMessageInfo} from '#/components/dms/getSystemMessageInfo'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function SystemMessageItem({
  item,
}: {
  item: ConvoItem & {type: 'system-message'}
}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()

  const info = getSystemMessageInfo(item.message.data, item.relatedProfiles)
  if (!info) return null

  const {Icon, action} = info
  const text = i18n._(info.message)

  const row = (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_center,
        a.px_md,
        a.mt_md,
      ]}>
      <Icon size="xs" style={[a.mr_2xs, t.atoms.text_contrast_medium]} />
      <Text
        style={[
          a.text_xs,
          a.text_center,
          t.atoms.text_contrast_medium,
          {includeFontPadding: false, textAlignVertical: 'center'},
        ]}>
        {text}
      </Text>
    </View>
  )

  switch (action?.kind) {
    case 'profile':
      return (
        <Link
          to={makeProfileLink(action.profile)}
          label={text}
          accessibilityHint={l`Opens profile`}
          style={a.w_full}>
          {row}
        </Link>
      )
    case 'inviteLink':
      // TODO Need to invoke InviteLinkDialog for this case. -dsb
      return row
    default:
      return row
  }
}
