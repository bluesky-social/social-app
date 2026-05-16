import {type ChatBskyActorDefs, ChatBskyConvoDefs} from '@atproto/api'
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

export type SystemMessageAction =
  | {
      kind: 'profile'
      profile: ChatBskyActorDefs.ProfileViewBasic
      displayName: string
    }
  | {kind: 'inviteLink'}

export type SystemMessageInfo = {
  message: MessageDescriptor
  Icon: React.ComponentType<SVGIconProps>
  action?: SystemMessageAction
}

function getProfileAction(
  user: ChatBskyConvoDefs.SystemMessageReferredUser,
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>,
): Extract<SystemMessageAction, {kind: 'profile'}> | null {
  const profile = relatedProfiles.get(user.did)
  if (!profile) return null
  return {
    kind: 'profile',
    profile,
    displayName: createSanitizedDisplayName(profile),
  }
}

export function getSystemMessageInfo(
  data: ChatBskyConvoDefs.SystemMessageView['data'],
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>,
): SystemMessageInfo | null {
  if (ChatBskyConvoDefs.isSystemMessageDataAddMember(data)) {
    const action = getProfileAction(data.member, relatedProfiles)
    return {
      Icon: JoinIcon,
      message: action
        ? msg`${action.displayName} was added to the group`
        : msg`Someone was added to the group`,
      action: action ?? undefined,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataRemoveMember(data)) {
    const action = getProfileAction(data.member, relatedProfiles)
    return {
      Icon: LeaveIcon,
      message: action
        ? msg`${action.displayName} was removed from the group`
        : msg`Someone was removed from the group`,
      action: action ?? undefined,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataMemberJoin(data)) {
    const action = getProfileAction(data.member, relatedProfiles)
    return {
      Icon: JoinIcon,
      message: action
        ? msg`${action.displayName} joined the group`
        : msg`Someone joined the group`,
      action: action ?? undefined,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataMemberLeave(data)) {
    const action = getProfileAction(data.member, relatedProfiles)
    return {
      Icon: LeaveIcon,
      message: action
        ? msg`${action.displayName} left the group`
        : msg`Someone left the group`,
      action: action ?? undefined,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataLockConvo(data)) {
    return {Icon: LockIcon, message: msg`Chat locked`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataUnlockConvo(data)) {
    return {Icon: UnlockIcon, message: msg`Chat unlocked`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataLockConvoPermanently(data)) {
    return {Icon: LockIcon, message: msg`Chat ended`}
  } else if (ChatBskyConvoDefs.isSystemMessageDataEditGroup(data)) {
    return {
      Icon: PencilIcon,
      message: data.newName
        ? msg`Chat title changed to ${data.newName}`
        : msg`Chat title changed`,
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataCreateJoinLink(data)) {
    return {
      Icon: ChainLinkIcon,
      message: msg`Invite link created`,
      action: {kind: 'inviteLink'},
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataEditJoinLink(data)) {
    return {
      Icon: ChainLinkIcon,
      message: msg`Invite link edited`,
      action: {kind: 'inviteLink'},
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataEnableJoinLink(data)) {
    return {
      Icon: ChainLinkIcon,
      message: msg`Invite link enabled`,
      action: {kind: 'inviteLink'},
    }
  } else if (ChatBskyConvoDefs.isSystemMessageDataDisableJoinLink(data)) {
    return {
      Icon: ChainLinkBrokenIcon,
      message: msg`Invite link disabled`,
      action: {kind: 'inviteLink'},
    }
  }
  return null
}
