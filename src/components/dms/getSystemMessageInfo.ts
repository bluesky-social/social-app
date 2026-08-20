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
import type * as ChatBskyActorDefs from '#/lexicons/chat/bsky/actor/defs'
import * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import * as bsky from '#/types/bsky'

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
  opts = {short: false},
): SystemMessageInfo | null {
  if (bsky.isType(ChatBskyConvoDefs.systemMessageDataAddMember, data)) {
    const action = getProfileAction(data.member, relatedProfiles)
    return {
      Icon: JoinIcon,
      message: action
        ? opts.short
          ? msg`${action.displayName} was added`
          : msg`${action.displayName} was added to the group`
        : opts.short
          ? msg`Someone was added`
          : msg`Someone was added to the group`,
      action: action ?? undefined,
    }
  } else if (
    bsky.isType(ChatBskyConvoDefs.systemMessageDataRemoveMember, data)
  ) {
    const action = getProfileAction(data.member, relatedProfiles)
    return {
      Icon: LeaveIcon,
      message: action
        ? opts.short
          ? msg`${action.displayName} was removed`
          : msg`${action.displayName} was removed from the group`
        : opts.short
          ? msg`Someone was removed`
          : msg`Someone was removed from the group`,
      action: action ?? undefined,
    }
  } else if (bsky.isType(ChatBskyConvoDefs.systemMessageDataMemberJoin, data)) {
    const action = getProfileAction(data.member, relatedProfiles)
    return {
      Icon: JoinIcon,
      message: action
        ? opts.short
          ? msg`${action.displayName} joined`
          : msg`${action.displayName} joined the group`
        : opts.short
          ? msg`Someone joined`
          : msg`Someone joined the group`,
      action: action ?? undefined,
    }
  } else if (
    bsky.isType(ChatBskyConvoDefs.systemMessageDataMemberLeave, data)
  ) {
    const action = getProfileAction(data.member, relatedProfiles)
    return {
      Icon: LeaveIcon,
      message: action
        ? opts.short
          ? msg`${action.displayName} left`
          : msg`${action.displayName} left the group`
        : opts.short
          ? msg`Someone left`
          : msg`Someone left the group`,
      action: action ?? undefined,
    }
  } else if (bsky.isType(ChatBskyConvoDefs.systemMessageDataLockConvo, data)) {
    return {Icon: LockIcon, message: msg`Chat locked`}
  } else if (
    bsky.isType(ChatBskyConvoDefs.systemMessageDataUnlockConvo, data)
  ) {
    return {Icon: UnlockIcon, message: msg`Chat unlocked`}
  } else if (
    bsky.isType(ChatBskyConvoDefs.systemMessageDataLockConvoPermanently, data)
  ) {
    return {Icon: LockIcon, message: msg`Chat ended`}
  } else if (bsky.isType(ChatBskyConvoDefs.systemMessageDataEditGroup, data)) {
    return {
      Icon: PencilIcon,
      message:
        data.newName && !opts.short
          ? msg`Chat title changed to ${data.newName}`
          : msg`Chat title changed`,
    }
  } else if (
    bsky.isType(ChatBskyConvoDefs.systemMessageDataCreateJoinLink, data)
  ) {
    return {
      Icon: ChainLinkIcon,
      message: msg`Invite link created`,
      action: {kind: 'inviteLink'},
    }
  } else if (
    bsky.isType(ChatBskyConvoDefs.systemMessageDataEditJoinLink, data)
  ) {
    return {
      Icon: ChainLinkIcon,
      message: msg`Invite link edited`,
      action: {kind: 'inviteLink'},
    }
  } else if (
    bsky.isType(ChatBskyConvoDefs.systemMessageDataEnableJoinLink, data)
  ) {
    return {
      Icon: ChainLinkIcon,
      message: msg`Invite link enabled`,
      action: {kind: 'inviteLink'},
    }
  } else if (
    bsky.isType(ChatBskyConvoDefs.systemMessageDataDisableJoinLink, data)
  ) {
    return {
      Icon: ChainLinkBrokenIcon,
      message: msg`Invite link disabled`,
      action: {kind: 'inviteLink'},
    }
  }
  return null
}
