import type AtpAgent from '@atproto/api'
import {type ChatBskyActorDeclaration} from '@atproto/api'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import {
  getOtherRequiredDataFromCache,
  setOtherRequiredDataActorDeclarationCache,
} from '#/ageAssurance/data'

/**
 * Helper to update the chat settings record.
 */
export async function restrictChatSettings({
  agent,
  did,
}: {
  agent: AtpAgent
  did: string
}): Promise<void> {
  try {
    const record: ChatBskyActorDeclaration.Main = {
      $type: 'chat.bsky.actor.declaration',
      allowIncoming: 'none',
    }
    await networkRetry(3, () =>
      agent.com.atproto.repo.putRecord({
        repo: did,
        collection: 'chat.bsky.actor.declaration',
        rkey: 'self',
        record,
      }),
    )
    // important, update local cache to avoid running this again
    setOtherRequiredDataActorDeclarationCache({
      did,
      actorDeclaration: record,
    })
  } catch {
    logger.error(`restrictChatSettings: failed to set chat declaration`)
  }
}

/**
 * Locks the user out of being added to group chats by setting
 * `allowGroupInvites: 'none'` on the chat actor declaration. Used for under-18
 * users, who per spec cannot participate in group chats.
 *
 * Preserves the existing `allowIncoming` value if one is cached, otherwise
 * defaults to 'following' (the lexicon default) since the field is required.
 */
export async function restrictGroupChatSettings({
  agent,
  did,
}: {
  agent: AtpAgent
  did: string
}): Promise<void> {
  const cached = getOtherRequiredDataFromCache({did})?.actorDeclaration
  if (cached?.allowGroupInvites === 'none') return

  try {
    const record: ChatBskyActorDeclaration.Main = {
      $type: 'chat.bsky.actor.declaration',
      allowIncoming: cached?.allowIncoming ?? 'following',
      allowGroupInvites: 'none',
    }
    await networkRetry(3, () =>
      agent.com.atproto.repo.putRecord({
        repo: did,
        collection: 'chat.bsky.actor.declaration',
        rkey: 'self',
        record,
      }),
    )
    setOtherRequiredDataActorDeclarationCache({
      did,
      actorDeclaration: record,
    })
  } catch {
    logger.error(`restrictGroupChatSettings: failed to set chat declaration`)
  }
}
