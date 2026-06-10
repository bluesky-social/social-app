import {
  type $Typed,
  ChatBskyActorDefs,
  ChatBskyConvoDefs,
  moderateProfile,
  type ModerationOpts,
} from '@atproto/api'

import {EMOJI_REACTION_LIMIT} from '#/lib/constants'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/profile-shadow'
import {type ConvoState, ConvoStatus} from '#/state/messages/convo/types'
import {type ReportSubject} from '#/components/moderation/ReportDialog/types'
import * as bsky from '#/types/bsky'

export const MESSAGE_GAP_THRESHOLD_MS = 60 * 60 * 1000
export const CLUSTERED_MESSAGE_THRESHOLD_MS = 5 * 60 * 1000

export function canBeMessaged(profile: bsky.profile.AnyProfileView) {
  switch (profile.associated?.chat?.allowIncoming) {
    case 'none':
      return false
    case 'all':
      return true
    // if unset, treat as following
    case 'following':
    case undefined:
      return Boolean(profile.viewer?.followedBy)
    // any other values are invalid according to the lexicon, so
    // let's treat as false to be safe
    default:
      return false
  }
}

export function canBeAddedToGroup(profile: bsky.profile.AnyProfileView) {
  switch (profile.associated?.chat?.allowGroupInvites) {
    case 'none':
      return false
    case 'all':
      return true
    case 'following':
      return Boolean(profile.viewer?.followedBy)
    case undefined:
      return canBeMessaged(profile)
    default:
      return false
  }
}

/**
 * Resolves the effective `allowGroupInvites` value for a chat declaration.
 * When unset, group invites follow the general DM preference
 * (`allowIncoming`), which itself defaults to `following`. This mirrors the
 * `undefined` fallthrough in canBeAddedToGroup, and is the single source of
 * truth for both displaying and persisting the setting.
 */
export function resolveAllowGroupInvites(
  chat: {allowIncoming?: string; allowGroupInvites?: string} | undefined,
): 'all' | 'none' | 'following' {
  return (chat?.allowGroupInvites ?? chat?.allowIncoming ?? 'following') as
    | 'all'
    | 'none'
    | 'following'
}

export function localDateString(date: Date) {
  // can't use toISOString because it should be in local time
  const mm = date.getMonth()
  const dd = date.getDate()
  const yyyy = date.getFullYear()
  // not padding with 0s because it's not necessary, it's just used for comparison
  return `${yyyy}-${mm}-${dd}`
}

export function hasAlreadyReacted(
  message: ChatBskyConvoDefs.MessageView,
  myDid: string | undefined,
  emoji: string,
): boolean {
  if (!message.reactions) {
    return false
  }
  return !!message.reactions.find(
    reaction => reaction.value === emoji && reaction.sender.did === myDid,
  )
}

export function hasReachedReactionLimit(
  message: ChatBskyConvoDefs.MessageView,
  myDid: string | undefined,
): boolean {
  if (!message.reactions) {
    return false
  }
  const myReactions = message.reactions.filter(
    reaction => reaction.sender.did === myDid,
  )
  return myReactions.length >= EMOJI_REACTION_LIMIT
}

/**
 * Whether the active conversation accepts emoji reactions. Reactions are
 * unavailable when:
 * - the convo is in the disabled state
 * - a group convo is locked or permanently locked
 * - 1-1: the other user is blocked or is blocking us
 * - group: we are blocking the primary member (the owner)
 */
export function canReact({
  convoState,
  primaryMember,
  moderationOpts,
}: {
  convoState: ConvoState
  primaryMember: Shadow<bsky.profile.AnyProfileView> | undefined
  moderationOpts: ModerationOpts | undefined
}): boolean {
  if (convoState.status === ConvoStatus.Disabled) {
    return false
  }

  if (!convoState.convo) {
    return true
  }

  if (convoState.convo.kind === 'group') {
    const {lockStatus} = convoState.convo.details
    if (lockStatus === 'locked' || lockStatus === 'locked-permanently') {
      return false
    }
  }

  if (primaryMember && moderationOpts) {
    const moderation = moderateProfile(primaryMember, moderationOpts)
    if (convoState.convo.kind === 'direct') {
      // Either direction (blocking or blocked-by) hides reactions in 1-1s
      if (moderation.blocked) return false
    } else {
      // In groups, only "we are blocking" the owner hides reactions
      const isBlockingPrimary = moderation
        .ui('profileView')
        .alerts.some(alert => alert.type === 'blocking')
      if (isBlockingPrimary) return false
    }
  }

  return true
}

export type GroupConvoMember = ChatBskyActorDefs.ProfileViewBasic & {
  // can be missing if account deleted
  kind?: $Typed<ChatBskyActorDefs.GroupConvoMember>
}

export type DirectConvoMember = ChatBskyActorDefs.ProfileViewBasic & {
  kind: $Typed<ChatBskyActorDefs.DirectConvoMember>
}

export type ConvoWithDetails = {view: ChatBskyConvoDefs.ConvoView} & (
  | {
      kind: 'group'
      details: $Typed<ChatBskyConvoDefs.GroupConvo>
      primaryMember?: GroupConvoMember // the owner - may have left, thus optional
      members: Array<GroupConvoMember>
    }
  | {
      kind: 'direct'
      details: $Typed<ChatBskyConvoDefs.DirectConvo>
      primaryMember: DirectConvoMember // the other user
      members: Array<DirectConvoMember>
    }
)

/**
 * Converts a raw convoView into something easier to use (i.e. extracts chat owner)
 * and enforces the correct type for convo members.
 */
export function parseConvoView(
  convoView: ChatBskyConvoDefs.ConvoView,
  ownDid: string | undefined,
): ConvoWithDetails | null {
  if (
    bsky.dangerousIsType<ChatBskyConvoDefs.GroupConvo>(
      convoView.kind,
      ChatBskyConvoDefs.isGroupConvo,
    )
  ) {
    let owner: GroupConvoMember | undefined = undefined

    for (const member of convoView.members) {
      if (
        bsky.dangerousIsType<ChatBskyActorDefs.GroupConvoMember>(
          member.kind,
          ChatBskyActorDefs.isGroupConvoMember,
        )
      ) {
        if (member.kind.role === 'owner') {
          // have to do a type assertion here
          // this works: {...member, kind: member.kind}
          // however that's creating a new object for no good reason
          owner = member as GroupConvoMember
        }
      } else {
        logger.warn(
          'Expected a GroupConvoMember, got an unknown kind of member',
        )
        return null
      }
    }

    return {
      view: convoView,
      kind: 'group',
      details: convoView.kind,
      primaryMember: owner,
      members: convoView.members as Array<GroupConvoMember>,
    }
  } else if (
    bsky.dangerousIsType<ChatBskyConvoDefs.DirectConvo>(
      convoView.kind,
      ChatBskyConvoDefs.isDirectConvo,
    )
  ) {
    const otherUser = convoView.members.find(m => m.did !== ownDid)

    if (!otherUser) {
      logger.warn('No other user found in direct convo')
      return null
    }

    return {
      view: convoView,
      kind: 'direct',
      details: convoView.kind,
      primaryMember: otherUser as DirectConvoMember,
      members: convoView.members as Array<DirectConvoMember>,
    }
  } else {
    logger.warn('Unknown convo kind: ' + JSON.stringify(convoView.kind))
    return null
  }
}

/**
 * Resolves the report subject for a conversation-level "Report conversation"
 * action (as opposed to reporting an individual message, which always reports
 * that message + its sender).
 *
 * - group: always report the whole convo, targeting the owner. Returns null if
 *   the owner has left, in which case there is nothing to report against.
 * - direct: report the last reportable message if there is one (i.e. the last
 *   message exists and wasn't sent by us), otherwise report the whole convo
 *   targeting the other user.
 */
export function getConvoReportSubject(
  convo: ConvoWithDetails,
  ownDid: string | undefined,
): ReportSubject | null {
  if (convo.kind === 'group') {
    if (!convo.primaryMember) return null
    return {convoId: convo.view.id, did: convo.primaryMember.did}
  }

  const lastMessage = convo.view.lastMessage
  const reportableMessage =
    ChatBskyConvoDefs.isMessageView(lastMessage) &&
    lastMessage.sender?.did !== ownDid
      ? lastMessage
      : null

  if (reportableMessage) {
    return {
      view: 'convo',
      convoId: convo.view.id,
      message: reportableMessage,
    }
  }

  return {convoId: convo.view.id, did: convo.primaryMember.did}
}
