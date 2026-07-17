import {Client} from '@atproto/lex'
import {api} from '@bsky.app/sdk'

import {IS_TEST_USER} from '#/lib/constants'
import {com} from '#/lexicons'
import {configureAdditionalModerationAuthorities} from './additional-moderation-authorities'
import {readLabelers} from './agent-config'
import {type SessionBundle} from './session-core'
import {type SessionAccount} from './types'

/*
 * The Bluesky moderation labeler DID is `api.moderation.did` (from
 * '@bsky.app/sdk'), value `did:plc:ar7c4by46qjdydhdevvrndac`. We use it
 * everywhere: the global appLabelers config, the per-account filter, and the
 * appview client's base labeler (matching `buildAppviewClient`); all resolve to
 * identical `atproto-accept-labelers` headers.
 */

/**
 * Set the global app labelers on the lex `Client` static so every client emits
 * the same global (`;redact`-suffixed) `atproto-accept-labelers` header.
 */
function configureGlobalAppLabelers(dids: string[]) {
  Client.configure({appLabelers: dids as `did:${string}:${string}`[]})
}

/**
 * Apply an account's subscribed labeler DIDs to a live appview client. The lex
 * `Client` rebuilds the `atproto-accept-labelers` header per request, so this
 * takes effect on the very next request without a client rebuild.
 *
 * The Bluesky moderation labeler is always re-asserted as the base: sending ANY
 * `atproto-accept-labelers` header replaces the server-side default, and
 * `setLabelers` clears then re-adds, so the moderation DID must be included
 * explicitly to stay active.
 */
export function applyLabelersToClient(
  client: Client,
  subscribedDids: string[],
) {
  const perAccount = subscribedDids.filter(did => did !== api.moderation.did)
  client.setLabelers([
    api.moderation.did,
    ...perAccount,
  ] as `did:${string}:${string}`[])
}

export function configureModerationForGuest() {
  // This global mutation is *only* OK because this code is only relevant for testing.
  // Don't add any other global behavior here!
  switchToBskyAppLabeler()
  configureAdditionalModerationAuthorities()
}

/**
 * Configure moderation labelers for a signed-in account.
 *
 * Takes the whole {@link SessionBundle} so it can apply per-account labelers to
 * the authed appview client (`bundle.appviewClient`, backing `useLexClient()`).
 */
export async function configureModerationForAccount(
  bundle: SessionBundle,
  account: SessionAccount,
) {
  // This global mutation is *only* OK because this code is only relevant for testing.
  // Don't add any other global behavior here!
  switchToBskyAppLabeler()
  if (IS_TEST_USER(account.handle)) {
    await trySwitchToTestAppLabeler(bundle)
  }

  // The code below is actually relevant to production (and isn't global).
  const labelerDids = await readLabelers(account.did).catch(_ => {})
  if (labelerDids) {
    // Apply the per-account labelers to the appview client.
    applyLabelersToClient(bundle.appviewClient, labelerDids)
  } else {
    // If there are no headers in the storage, we'll not send them on the initial requests.
    // If we wanted to fix this, we could block on the preferences query here.
  }

  configureAdditionalModerationAuthorities()
}

function switchToBskyAppLabeler() {
  configureGlobalAppLabelers([api.moderation.did])
}

/**
 * In the test environment, swap the global app labeler for the test-env
 * moderation authority. The handle is resolved via the bundle's authed appview
 * client; `client.call` returns the response body directly (no `{data}`
 * wrapper), so `resolveHandle`'s output is `{did}`.
 */
async function trySwitchToTestAppLabeler(bundle: SessionBundle) {
  const did = (
    await bundle.appviewClient
      .call(com.atproto.identity.resolveHandle, {handle: 'mod-authority.test'})
      .catch(_ => undefined)
  )?.did
  if (did) {
    console.warn('USING TEST ENV MODERATION')
    configureGlobalAppLabelers([did])
  }
}
