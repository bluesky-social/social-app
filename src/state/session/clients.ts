import {type AtpAgent} from '@atproto/api'
import {Client} from '@atproto/lex-client'

import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'

/**
 * Stable per-agent cache of lex `Client` instances. We never reuse an
 * `AtpAgent` (the session provider disposes the previous one on switch), so a
 * `WeakMap` keyed on the agent gives us a client whose identity is stable for
 * the lifetime of that agent. This keeps React Query keys and hook consumers
 * from churning on every render.
 */
const clientForAgent = new WeakMap<AtpAgent, Client>()

/**
 * Wrap a live {@link AtpAgent} as a lex {@link Client}, bridging the old session
 * source of truth to the new SDK so features can migrate incrementally.
 *
 * The client talks to the agent through the minimal lex `Agent` interface
 * (`{ did, fetchHandler }`). We deliberately route `fetchHandler` through
 * `agent.fetchHandler` (the agent's XRPC dispatch layer) rather than
 * `agent.sessionManager.fetchHandler`:
 *
 * - `agent.fetchHandler` (see @atproto/api `agent.js`) is where the agent
 *   applies its configured `atproto-proxy` header (set via `configureProxy` to
 *   the appview) and its `atproto-accept-labelers` header, before delegating to
 *   `sessionManager.fetchHandler` for authorization + token refresh.
 * - `sessionManager.fetchHandler` (`CredentialSession`) only adds the auth
 *   token and handles refresh - it does NOT proxy or attach labelers. Wrapping
 *   it directly would silently drop appview proxying and moderation labelers.
 *
 * Because the wrapped agent already applies proxy + labeler headers, we do NOT
 * pass a `service` option to the `Client` (lex-client only sets `atproto-proxy`
 * when `service` is provided) and we leave `Client.appLabelers` at its default
 * empty set. This avoids double-setting either header.
 *
 * Results are memoized per-agent so the returned client is referentially stable.
 */
export function agentToLexClient(agent: AtpAgent): Client {
  const cached = clientForAgent.get(agent)
  if (cached) {
    return cached
  }
  const client = new Client({
    get did() {
      return agent.did
    },
    fetchHandler: (path, init) => agent.fetchHandler(path, init),
  })
  clientForAgent.set(agent, client)
  return client
}

/**
 * Lazily-constructed unauthenticated client pointed at the public appview. It
 * hits {@link PUBLIC_BSKY_SERVICE} directly, mirroring `createPublicAgent`'s
 * service URL, so no proxying is required.
 */
let publicClient: Client | undefined

function getPublicLexClient(): Client {
  publicClient ??= new Client(PUBLIC_BSKY_SERVICE)
  return publicClient
}

/**
 * Unauthenticated lex {@link Client} for public appview reads. A process-wide
 * singleton, so its identity is stable across renders.
 */
export function usePublicLexClient(): Client {
  return getPublicLexClient()
}
