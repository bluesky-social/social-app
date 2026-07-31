import {Client} from '@atproto/lex'
import {api} from '@bsky.app/sdk'

import {IS_TEST_USER} from '#/lib/constants'
import {com} from '#/lexicons'
import {account as accountStorage} from '#/storage'
import {configureAdditionalModerationAuthorities} from './additional-moderation-authorities'
import {type SessionBundle} from './session-core'
import {type SessionAccount} from './types'

/**
 * Set the global app labelers on the lex `Client` static so every client emits
 * the same `;redact` moderation authorities.
 */
function configureGlobalAppLabelers(dids: string[]) {
  Client.configure({appLabelers: dids as `did:${string}:${string}`[]})
}

/**
 * Cache an account's subscribed labeler DIDs. Called on every preferences
 * fetch, so the cache is eventually consistent with the server.
 */
export function saveLabelers(did: string, value: string[]) {
  accountStorage.set([did, 'labelers'], value)
}

/**
 * Read the cached labeler DIDs for an account, or `undefined` if none have
 * been cached yet (first session on this device) or the entry is unreadable.
 */
export function readLabelers(did: string): string[] | undefined {
  try {
    return accountStorage.get([did, 'labelers'])
  } catch {
    /* a corrupt entry fails JSON.parse inside Storage.get; treat as no cache */
    return undefined
  }
}

/**
 * Apply account subscriptions without duplicating the globally redacted
 * Bluesky moderation authority.
 */
export function applyLabelersToClient(
  client: Client,
  subscribedDids: string[],
) {
  const perAccount = subscribedDids.filter(did => did !== api.moderation.did)
  client.setLabelers(perAccount as `did:${string}:${string}`[])
}

export function configureModerationForGuest() {
  switchToBskyAppLabeler()
  configureAdditionalModerationAuthorities()
}

/** Configure global authorities and cached account subscriptions. */
export function configureModerationForAccount(
  bundle: SessionBundle,
  account: SessionAccount,
) {
  switchToBskyAppLabeler()
  if (IS_TEST_USER(account.handle)) {
    // Test accounts may briefly use the production authority while this resolves.
    void trySwitchToTestAppLabeler(bundle)
  }

  const labelerDids = readLabelers(account.did)
  if (labelerDids) {
    applyLabelersToClient(bundle.bskyClient, labelerDids)
  } else {
    // The preferences query populates the cache after the initial requests.
  }

  configureAdditionalModerationAuthorities()
}

function switchToBskyAppLabeler() {
  configureGlobalAppLabelers([api.moderation.did])
}

/** Resolve and install the test environment's moderation authority. */
async function trySwitchToTestAppLabeler(bundle: SessionBundle) {
  const did = (
    await bundle.bskyClient
      .call(com.atproto.identity.resolveHandle, {handle: 'mod-authority.test'})
      .catch(_ => undefined)
  )?.did
  if (did) {
    console.warn('USING TEST ENV MODERATION')
    configureGlobalAppLabelers([did])
  }
}
