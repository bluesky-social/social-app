import {type Client} from '@atproto/lex'

import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {createLexClient} from '#/lib/lexClient'
import {type BskyAppAgent} from './bridge-agent'
import {networkAwareFetch} from './network'

/*
 * One client per agent, so that repeated reads for the same agent return the
 * same instance. Client identity is observable: a lex `Client` is passed to
 * React Query `queryFn`s and read from render paths, so a freshly allocated
 * client on every read would break any dependency array or reference
 * comparison built on top of it.
 *
 * Keying on the agent also ties client lifetime to agent lifetime. A disposed
 * agent's `fetchHandler` falls back to unauthenticated fetch, and session
 * rotation builds a new agent rather than mutating the old one, so a client
 * derived from a stale agent becomes unreachable exactly when its agent does.
 */
const lexClients = new WeakMap<BskyAppAgent, Client>()

/**
 * The lex {@link Client} for an agent, memoized per agent.
 *
 * The wrapped handler is `agent.fetchHandler`, NOT
 * `agent.sessionManager.fetchHandler`. The agent-level handler is where
 * `atproto-proxy` and `atproto-accept-labelers` are set before the request is
 * passed down to the session manager, which only adds authorization and PDS
 * routing. Because the agent already emits both headers, the client is
 * deliberately built with neither a `service` option nor labelers - setting
 * either here would emit them a second time.
 */
export function agentToLexClient(agent: BskyAppAgent): Client {
  const existing = lexClients.get(agent)
  if (existing) {
    return existing
  }
  const client = createLexClient({
    get did() {
      return agent.did
    },
    fetchHandler: (path, init) => agent.fetchHandler(path, init),
  })
  lexClients.set(agent, client)
  return client
}

let publicLexClient: Client | undefined

/**
 * The unauthenticated {@link Client} for public reads, pointed at the public
 * appview.
 *
 * A single module-level instance for the same identity-stability reason as
 * {@link agentToLexClient}: there is no session to scope it to, so it lives for
 * the lifetime of the process. Requests go through {@link networkAwareFetch} so
 * public reads feed the app's reachability signal like authenticated ones do.
 *
 * Unlike the public agent it parallels, this client sends neither
 * `atproto-proxy` nor `atproto-accept-labelers`. `createPublicAgent` configures
 * the app labeler and the proxy header, so a logged-out appview *agent* read
 * does carry labelers while the same read through this client does not. A
 * consumer that needs moderation labels on public reads must configure labelers
 * itself before issuing the request.
 */
export function getPublicLexClient(): Client {
  return (publicLexClient ??= createLexClient({
    service: PUBLIC_BSKY_SERVICE,
    fetch: networkAwareFetch,
  }))
}
