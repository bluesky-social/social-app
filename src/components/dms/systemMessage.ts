import {ChatBskyConvoDefs} from '@atproto/api'
import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon} from '#/components/icons/ArrowBoxLeft'
import {ArrowBoxRight_Stroke2_Corner3_Rounded as JoinIcon} from '#/components/icons/ArrowBoxRight'
import {
  ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon,
  ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon,
} from '#/components/icons/ChainLink'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  Lock_Stroke2_Corner0_Rounded as LockIcon,
  Unlock_Stroke2_Corner2_Rounded as UnlockIcon,
} from '#/components/icons/Lock'
import {PencilLine_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'

export type SystemMessageInfo = {
  message: MessageDescriptor
  Icon: React.ComponentType<SVGIconProps>
}

export function getSystemMessageInfo(
  data: ChatBskyConvoDefs.SystemMessageView['data'],
): SystemMessageInfo | null {
  if (ChatBskyConvoDefs.isSystemMessageDataAddMember(data)) {
    return {
      Icon: JoinIcon,
      message: msg`${createSanitizedDisplayName(data.member)} was added to the group`,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataRemoveMember(data)) {
    return {
      Icon: LeaveIcon,
      message: msg`${createSanitizedDisplayName(data.member)} was removed from the group`,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataMemberJoin(data)) {
    return {
      Icon: JoinIcon,
      message: msg`${createSanitizedDisplayName(data.member)} joined the group`,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataMemberLeave(data)) {
    return {
      Icon: LeaveIcon,
      message: msg`${createSanitizedDisplayName(data.member)} left the group`,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataLockConvo(data)) {
    return {Icon: LockIcon, message: msg`Chat locked`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataUnlockConvo(data)) {
    return {Icon: UnlockIcon, message: msg`Chat unlocked`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataLockConvoPermanently(data)) {
    return {Icon: LockIcon, message: msg`Chat locked permanently`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataEditGroup(data)) {
    return {
      Icon: PencilIcon,
      message: msg`Chat title changed to ${data.newName ?? ''}`,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataCreateJoinLink(data)) {
    return {Icon: ChainLinkIcon, message: msg`Invite link created`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataEditJoinLink(data)) {
    return {Icon: ChainLinkIcon, message: msg`Invite link edited`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataEnableJoinLink(data)) {
    return {Icon: ChainLinkIcon, message: msg`Invite link enabled`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataDisableJoinLink(data)) {
    return {Icon: ChainLinkBrokenIcon, message: msg`Invite link disabled`}
  }
  return null
}
