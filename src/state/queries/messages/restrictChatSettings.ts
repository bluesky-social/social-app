import {type Client} from '@atproto/lex-client'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import {
  getDidFromClient,
  getOtherRequiredDataFromCache,
  setOtherRequiredDataActorDeclarationCache,
} from '#/ageAssurance/data'
import {chat} from '#/lexicons'

/**
 * Updates the chat actor declaration record to restrict who can contact the
 * user. Both restrictions write to the same record (`rkey: 'self'`), so this
 * is a single helper to avoid two concurrent `putRecord` calls racing each
 * other and clobbering one another's changes.
 *
 * - `restrictIncoming`: sets `allowIncoming: 'none'` (used when a user isn't
 *   age-assured).
 * - `restrictGroupInvites`: sets `allowGroupInvites: 'none'` (used for under-18
 *   users, who per spec cannot participate in group chats).
 *
 * Dimensions that aren't being restricted preserve their cached value, falling
 * back to the lexicon defaults when the cache is empty.
 */
export async function restrictChatSettings({
  client,
  restrictIncoming = false,
  restrictGroupInvites = false,
}: {
  client: Client
  restrictIncoming?: boolean
  restrictGroupInvites?: boolean
}): Promise<void> {
  const did = getDidFromClient(client)
  if (!did) return

  const cached = getOtherRequiredDataFromCache({did})?.actorDeclaration

  // When the cache is empty we fall back to defaults for any dimension we're
  // not explicitly restricting, which could drop/downgrade a value the user
  // has actually set server-side. The cache should be hydrated by
  // prefetchOtherRequiredData before any of these paths fire, so log if that
  // assumption ever breaks. (Restricting both dimensions is unaffected, so
  // don't warn for the common signup/birthdate-change case.)
  if (!cached && (!restrictIncoming || !restrictGroupInvites)) {
    logger.warn(
      `restrictChatSettings: cache miss, falling back to defaults for unrestricted dimensions`,
    )
  }

  const record: chat.bsky.actor.declaration.Main = {
    $type: 'chat.bsky.actor.declaration',
    allowIncoming: restrictIncoming
      ? 'none'
      : (cached?.allowIncoming ?? 'following'),
    allowGroupInvites: restrictGroupInvites
      ? 'none'
      : cached?.allowGroupInvites,
  }

  // Nothing to do if the record already reflects the desired restrictions.
  if (
    cached?.allowIncoming === record.allowIncoming &&
    cached?.allowGroupInvites === record.allowGroupInvites
  ) {
    return
  }

  try {
    await networkRetry(3, () =>
      client.put(chat.bsky.actor.declaration, record, {
        repo: did,
        rkey: 'self',
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
