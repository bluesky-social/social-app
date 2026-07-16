import {Client} from '@atproto/lex-client'
import {api} from '@bsky.app/sdk'

import {IS_TEST_USER} from '#/lib/constants'
import {com} from '#/lexicons'
import {configureAdditionalModerationAuthorities} from './additional-moderation-authorities'
import {readLabelers} from './agent-config'
import {BridgeAgent, type SessionBundle} from './session-core'
import {type SessionAccount} from './types'

/*
 * The Bluesky moderation labeler DID. The old `BSKY_LABELER_DID` (from
 * '@atproto/api') and `api.moderation.did` (from '@bsky.app/sdk') are the SAME
 * value - `did:plc:ar7c4by46qjdydhdevvrndac` - verified at implementation. We
 * use `api.moderation.did` everywhere: the global appLabelers config, the
 * per-account filter, and the appview client's base labeler (matching
 * `buildAppviewClient`); all resolve to identical `atproto-accept-labelers`
 * headers.
 */

/**
 * Set the global app labelers on BOTH request paths so they emit identical
 * `atproto-accept-labelers` headers.
 *
 * The migration runs two live request stacks this phase: lex `Client`s (whose
 * global labelers live on the static `Client.appLabelers`) and the bridge
 * `SessionAgent`, a base `Agent` from '@atproto/api' (whose global labelers
 * live on the static `Agent.appLabelers`, NOT `AtpAgent`'s). We must configure
 * both so a request routed through either path carries the same global
 * (`;redact`-suffixed) labelers.
 */
function configureGlobalAppLabelers(dids: string[]) {
  Client.configure({appLabelers: dids as `did:${string}:${string}`[]})
  BridgeAgent.configure({appLabelers: dids})
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
 * Takes the whole {@link SessionBundle} because per-account labelers must be
 * applied to BOTH live request paths: the bridge agent (`bundle.agent`, still
 * used by `useAgent()` consumers) and the authed appview client
 * (`bundle.appviewClient`, backing `useLexClient()`).
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
    const perAccount = labelerDids.filter(did => did !== api.moderation.did)
    /*
     * Apply the per-account labelers to both live request paths. The appview
     * client re-asserts the Bluesky moderation labeler as its base because
     * sending ANY `atproto-accept-labelers` header replaces the server-side
     * default - `setLabelers` clears then re-adds, so the moderation DID must
     * be included explicitly to stay active.
     */
    bundle.agent.configureLabelers(perAccount)
    bundle.appviewClient.setLabelers([
      api.moderation.did,
      ...perAccount,
    ] as `did:${string}:${string}`[])
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
