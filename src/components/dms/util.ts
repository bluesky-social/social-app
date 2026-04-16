import {type $Typed, ChatBskyActorDefs, ChatBskyConvoDefs} from '@atproto/api'

import {EMOJI_REACTION_LIMIT} from '#/lib/constants'
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

type GroupConvoMember = ChatBskyActorDefs.ProfileViewBasic & {
  kind: $Typed<ChatBskyActorDefs.GroupConvoMember>
}

type DirectConvoMember = ChatBskyActorDefs.ProfileViewBasic & {
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
 */
export function parseConvoView(
  convo: ChatBskyConvoDefs.ConvoView,
  ownDid: string | undefined,
): ConvoWithDetails {
  if (
    bsky.dangerousIsType<ChatBskyConvoDefs.GroupConvo>(
      convo.kind,
      ChatBskyConvoDefs.isGroupConvo,
    )
  ) {
    let owner: GroupConvoMember | undefined = undefined

    for (const member of convo.members) {
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
        throw new Error(
          'Expected a GroupConvoMember, got an unknown kind of member',
        )
      }
    }

    if (!owner) {
      throw new Error('No owner found in group convo')
    }

    return {
      convo,
      kind: 'group',
      details: convo.kind,
      primaryMember: owner,
      members: convo.members as Array<GroupConvoMember>,
    }
  } else if (
    bsky.dangerousIsType<ChatBskyConvoDefs.DirectConvo>(
      convo.kind,
      ChatBskyConvoDefs.isDirectConvo,
    )
  ) {
    const otherUser = convo.members.find(m => m.did !== ownDid)

    if (
      !bsky.dangerousIsType<ChatBskyActorDefs.DirectConvoMember>(
        otherUser?.kind,
        ChatBskyActorDefs.isDirectConvoMember,
      )
    ) {
      throw new Error('No other user found in direct convo')
    }

    return {
      convo,
      kind: 'direct',
      details: convo.kind,
      primaryMember: otherUser as DirectConvoMember,
      members: convo.members as Array<DirectConvoMember>,
    }
  }
  throw new Error(`Unknown convo kind: ${JSON.stringify(convo.kind)}`)
}
