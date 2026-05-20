import {View} from 'react-native'
import {type ChatBskyActorDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {type ConvoItem} from '#/state/messages/convo/types'
import {useInviteLinkDialog} from '#/screens/Messages/components/InviteLinkDialogProvider'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {getSystemMessageInfo} from '#/components/dms/getSystemMessageInfo'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function SystemMessageItem({
  item,
  relatedProfiles,
}: {
  item: ConvoItem & {type: 'system-message'}
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()
  const inviteLinkControl = useInviteLinkDialog()

  const info = getSystemMessageInfo(item.message.data, relatedProfiles)
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
      if (!inviteLinkControl) return row
      return (
        <Button label={text} onPress={inviteLinkControl.open} style={a.w_full}>
          {row}
        </Button>
      )
    default:
      return row
  }
}
