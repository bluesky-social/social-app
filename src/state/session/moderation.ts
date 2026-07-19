import {Client} from '@atproto/lex'
import {api} from '@bsky.app/sdk'

import {IS_TEST_USER} from '#/lib/constants'
import {com} from '#/lexicons'
import {account as accountStorage} from '#/storage'
import {configureAdditionalModerationAuthorities} from './additional-moderation-authorities'
import {type SessionBundle} from './session-core'
import {type SessionAccount} from './types'

/*
 * The Bluesky moderation labeler (`api.moderation.did`) flows ONLY through the
 * global `Client.appLabelers` config: lex-client merges the static appLabelers
 * with each client's per-instance `labelers` into the `atproto-accept-labelers`
 * header on every request, and appLabelers entries carry the `;redact` suffix
 * (redaction authority) while plain per-instance labelers don't.
 */

/**
 * Set the global app labelers on the lex `Client` static so every client emits
 * the same global (`;redact`-suffixed) `atproto-accept-labelers` header.
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
 * Apply an account's subscribed labeler DIDs to a live client. The lex `Client`
 * rebuilds the header per request, so this takes effect on the next request
 * without a client rebuild.
 *
 * These labelers ride the `atproto-accept-labelers` header, which lex-client
 * 0.3.0 emits only on raw/query calls: record helpers default `labelers = null`
 * per call, stripping the header. That is fine here - labelers only matter for
 * the read/query calls moderation cares about.
 *
 * We filter out the Bluesky moderation labeler: it is already asserted globally
 * via `Client.appLabelers` (with `;redact`), and a user "subscribing" to it
 * must not add a second, plain (non-redact) header entry alongside the redacted
 * one.
 */
export function applyLabelersToClient(
  client: Client,
  subscribedDids: string[],
) {
  const perAccount = subscribedDids.filter(did => did !== api.moderation.did)
  client.setLabelers(perAccount as `did:${string}:${string}`[])
}

export function configureModerationForGuest() {
  // This global mutation is *only* OK because this code is only relevant for testing.
  // Don't add any other global behavior here!
  switchToBskyAppLabeler()
  configureAdditionalModerationAuthorities()
}

/**
 * Configure moderation labelers for a signed-in account. Fully synchronous:
 * the labeler cache is a local MMKV read, so the bundle leaves here with its
 * per-account labelers already applied, in the same tick.
 *
 * Takes the whole {@link SessionBundle} so it can apply per-account labelers to
 * the single merged Bluesky client (`bundle.bskyClient`, backing
 * `useLexClient()`).
 */
export function configureModerationForAccount(
  bundle: SessionBundle,
  account: SessionAccount,
) {
  // This global mutation is *only* OK because this code is only relevant for testing.
  // Don't add any other global behavior here!
  switchToBskyAppLabeler()
  if (IS_TEST_USER(account.handle)) {
    /*
     * Fire-and-forget: this resolves a handle over the network and only runs
     * in the test environment. Requests made before it lands use the standard
     * Bluesky app labeler; that race is acceptable for tests.
     */
    void trySwitchToTestAppLabeler(bundle)
  }

  // The code below is actually relevant to production (and isn't global).
  const labelerDids = readLabelers(account.did)
  if (labelerDids) {
    applyLabelersToClient(bundle.bskyClient, labelerDids)
  } else {
    /*
     * No cached labelers yet (first session on this device), so the initial
     * requests go out without them. We could block on the preferences query
     * here to fix that, but choose not to.
     */
  }

  configureAdditionalModerationAuthorities()
}

function switchToBskyAppLabeler() {
  configureGlobalAppLabelers([api.moderation.did])
}

/**
 * In the test environment, swap the global app labeler for the test-env
 * moderation authority, resolving its handle via the bundle's merged Bluesky
 * client. This is a raw call, so it inherits the appview proxy - which is
 * correct, as `resolveHandle` is served by the appview.
 */
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
