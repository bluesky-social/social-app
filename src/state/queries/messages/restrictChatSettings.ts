import type AtpAgent from '@atproto/api'
import {type ChatBskyActorDeclaration} from '@atproto/api'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import {setOtherRequiredDataActorDeclarationCache} from '#/ageAssurance/data'

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
