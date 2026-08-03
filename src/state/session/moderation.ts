import {type AtpAgent, BSKY_LABELER_DID} from '@atproto/api'
import {type Client} from '@atproto/lex'

import {IS_TEST_USER} from '#/lib/constants'
import {account as accountStorage} from '#/storage'
import {
  configureAdditionalModerationAuthorities,
  configureGlobalAppLabelers,
} from './additional-moderation-authorities'
import {type SessionAccount} from './types'

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
 * Apply an account's labeler subscriptions without duplicating the globally
 * redacted Bluesky moderation authority.
 *
 * The Bluesky DID is filtered out because it already flows through the global
 * `appLabelers`, which lex and the agent both emit with a `;redact` suffix.
 * Listing it per-subscription would add a second, non-redacting entry for the
 * same authority.
 *
 * Writes to the agent rather than the client: the agent-level fetch handler is
 * what stamps `atproto-accept-labelers` on the requests the wrapping clients
 * issue, so setting them here reaches every appview read. The bundle rework
 * moves this to `appviewClient.setLabelers` once the agent is gone.
 */
export function applyLabelersToClient(
  agent: AtpAgent,
  subscribedDids: string[],
) {
  agent.configureLabelersHeader(
    subscribedDids.filter(did => did !== BSKY_LABELER_DID),
  )
}

export function configureModerationForGuest() {
  // This global mutation is *only* OK because this code is only relevant for testing.
  // Don't add any other global behavior here!
  switchToBskyAppLabeler()
  configureAdditionalModerationAuthorities()
}

/**
 * Configure global app labelers and the account's cached labeler
 * subscriptions. Fully synchronous so session setup can apply labeler headers
 * in the same tick, before any request goes out.
 */
export function configureModerationForAccount(
  bundle: {agent: AtpAgent; appviewClient?: Client},
  account: SessionAccount,
) {
  // This global mutation is *only* OK because this code is only relevant for testing.
  // Don't add any other global behavior here!
  switchToBskyAppLabeler()
  if (IS_TEST_USER(account.handle)) {
    // Test accounts may briefly use the production authority while this resolves.
    void trySwitchToTestAppLabeler(bundle.agent)
  }

  // The code below is actually relevant to production (and isn't global).
  const labelerDids = readLabelers(account.did)
  if (labelerDids) {
    applyLabelersToClient(bundle.agent, labelerDids)
  } else {
    // If there are no headers in the storage, we'll not send them on the initial requests.
    // If we wanted to fix this, we could block on the preferences query here.
  }

  configureAdditionalModerationAuthorities()
}

function switchToBskyAppLabeler() {
  configureGlobalAppLabelers([BSKY_LABELER_DID])
}

/** Resolve and install the test environment's moderation authority. */
async function trySwitchToTestAppLabeler(agent: AtpAgent) {
  const did = (
    await agent
      .resolveHandle({handle: 'mod-authority.test'})
      .catch(_ => undefined)
  )?.data.did
  if (did) {
    console.warn('USING TEST ENV MODERATION')
    configureGlobalAppLabelers([did])
  }
}
