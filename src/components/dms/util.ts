import {type $Typed, ChatBskyActorDefs, ChatBskyConvoDefs} from '@atproto/api'

import {EMOJI_REACTION_LIMIT} from '#/lib/constants'
import {logger} from '#/logger'
import * as bsky from '#/types/bsky'

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
      details: ChatBskyConvoDefs.GroupConvo
      primaryMember: GroupConvoMember // the owner
      members: Array<GroupConvoMember>
    }
  | {
      kind: 'direct'
      details: ChatBskyConvoDefs.DirectConvo
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
  allMembers?: ChatBskyActorDefs.ProfileViewBasic[],
): ConvoWithDetails | null {
  const memberList = allMembers ?? convoView.members

  if (
    bsky.dangerousIsType<ChatBskyConvoDefs.GroupConvo>(
      convoView.kind,
      ChatBskyConvoDefs.isGroupConvo,
    )
  ) {
    let owner: GroupConvoMember | undefined = undefined

    for (const member of memberList) {
      if (
        bsky.dangerousIsType<ChatBskyActorDefs.GroupConvoMember>(
          member.kind,
          ChatBskyActorDefs.isGroupConvoMember,
        )
      ) {
        if (member.kind.role === 'owner') {
          owner = member as GroupConvoMember
        }
      } else {
        logger.warn(
          'Expected a GroupConvoMember, got an unknown kind of member',
        )
        return null
      }
    }

    if (!owner) {
      logger.warn('No owner found in group convo')
      return null
    }

    return {
      view: convoView,
      kind: 'group',
      details: convoView.kind,
      primaryMember: owner,
      members: memberList as Array<GroupConvoMember>,
    }
  } else if (
    bsky.dangerousIsType<ChatBskyConvoDefs.DirectConvo>(
      convoView.kind,
      ChatBskyConvoDefs.isDirectConvo,
    )
  ) {
    const otherUser = memberList.find(m => m.did !== ownDid)

    if (!otherUser) {
      logger.warn('No other user found in direct convo')
      return null
    }

    return {
      view: convoView,
      kind: 'direct',
      details: convoView.kind,
      primaryMember: otherUser as DirectConvoMember,
      members: memberList as Array<DirectConvoMember>,
    }
  } else {
    logger.warn('Unknown convo kind: ' + JSON.stringify(convoView.kind))
    return null
  }
}
