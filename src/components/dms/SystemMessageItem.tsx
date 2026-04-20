import {memo} from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {type ConvoItem} from '#/state/messages/convo/types'
import {atoms as a, useTheme} from '#/alf'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon} from '#/components/icons/ArrowBoxLeft'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {PencilLine_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {type Props as SVGIconProps} from '../icons/common'
import {Text} from '../Typography'

let SystemMessageItem = ({
  item,
}: {
  item: ConvoItem & {type: 'system-message'}
}): React.ReactNode => {
  const t = useTheme()
  const {t: l} = useLingui()

  const {data} = item.message

  let message: string | null = null
  let Icon: React.ComponentType<SVGIconProps> | null = null
  if (ChatBskyConvoDefs.isSystemMessageDataAddMember(data)) {
    Icon = ArrowBoxLeftIcon
    message = l`${createSanitizedDisplayName(data.member)} added to the group`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataRemoveMember(data)) {
    Icon = ArrowBoxLeftIcon
    message = l`${createSanitizedDisplayName(data.member)} removed from the group`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataMemberJoin(data)) {
    Icon = ArrowBoxLeftIcon
    message = l`${createSanitizedDisplayName(data.member)} joined the group`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataMemberLeave(data)) {
    Icon = ArrowBoxLeftIcon
    message = l`${createSanitizedDisplayName(data.member)} left the group`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataLockConvo(data)) {
    Icon = LockIcon
    message = l`Chat locked`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataUnlockConvo(data)) {
    Icon = LockIcon
    message = l`Chat unlocked`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataLockConvoPermanently(data)) {
    Icon = LockIcon
    message = l`Chat locked permanently`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataEditGroup(data)) {
    Icon = PencilIcon
    message = l`Chat title changed to ${data.newName}`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataCreateJoinLink(data)) {
    Icon = ChainLinkIcon
    message = l`Invite link created`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataEditJoinLink(data)) {
    Icon = ChainLinkIcon
    message = l`Invite link edited`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataEnableJoinLink(data)) {
    Icon = ChainLinkIcon
    message = l`Invite link enabled`
  }
  if (ChatBskyConvoDefs.isSystemMessageDataDisableJoinLink(data)) {
    Icon = ChainLinkIcon
    message = l`Invite link disabled`
  }

  if (!message) {
    return null
  }

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_center,
        a.px_md,
        a.mt_md,
      ]}>
      {Icon ? (
        <Icon size="sm" style={[a.mr_2xs, t.atoms.text_contrast_medium]} />
      ) : null}
      <Text
        style={[
          a.text_xs,
          a.text_center,
          t.atoms.bg,
          t.atoms.text_contrast_medium,
        ]}>
        {message}
      </Text>
    </View>
  )
}
SystemMessageItem = memo(SystemMessageItem)
export {SystemMessageItem}
