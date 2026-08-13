import {type Client} from '@atproto/lex'

import {CHAT_PROXY_SERVICE, PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {createLexClient} from '#/lib/lexClient'
import {type BskyAppAgent} from './bridge-agent'
import {networkAwareFetch} from './network'

/*
 * One client per agent, per surface, so that repeated reads for the same agent
 * return the same instance. Client identity is observable: a lex `Client` is
 * passed to React Query `queryFn`s and read from render paths, so a freshly
 * allocated client on every read would break any dependency array or reference
 * comparison built on top of it.
 *
 * Keying on the agent also ties client lifetime to agent lifetime. A disposed
 * agent's `fetchHandler` falls back to unauthenticated fetch, and session
 * rotation builds a new agent rather than mutating the old one, so a client
 * derived from a stale agent becomes unreachable exactly when its agent does.
 */
const appviewClients = new WeakMap<BskyAppAgent, Client>()
const pdsClients = new WeakMap<BskyAppAgent, Client>()
const chatClients = new WeakMap<BskyAppAgent, Client>()

/**
 * The appview {@link Client} for an agent, memoized per agent.
 *
 * The wrapped handler is `agent.fetchHandler`, NOT
 * `agent.sessionManager.fetchHandler`. The agent-level handler is where
 * `atproto-proxy` and `atproto-accept-labelers` are set before the request is
 * passed down to the session manager, which only adds authorization and PDS
 * routing. Because the agent already emits both headers, the client is
 * deliberately built with neither a `service` option nor labelers - setting
 * either here would emit them a second time.
 */
export function agentToAppviewClient(agent: BskyAppAgent): Client {
  const existing = appviewClients.get(agent)
  if (existing) {
    return existing
  }
  const client = createLexClient({
    get did() {
      return agent.did
    },
    fetchHandler: (path, init) => agent.fetchHandler(path, init),
  })
  appviewClients.set(agent, client)
  return client
}

/**
 * The account-host {@link Client} for an agent, memoized per agent.
 *
 * This wraps `agent.sessionManager.fetchHandler`, one layer below
 * {@link agentToAppviewClient}. That layer does authorization and refresh-on-401
 * and resolves the request against `dispatchUrl` (the account's PDS), but it
 * does NOT set `atproto-proxy` or `atproto-accept-labelers`, so requests reach
 * the PDS itself rather than being proxied onward. That is the right transport
 * for `com.atproto.*` repo/server/identity calls.
 *
 * No `service` option for the same reason: adding one would reintroduce the
 * proxy header this client exists to avoid.
 *
 * The handler is wrapped in a closure rather than passed by reference because
 * `PasswordSessionManager.fetchHandler` reads `this`. Relative paths are
 * intentional: lex-client hands its handler an origin-less
 * `/xrpc/<nsid>[?query]` path, which the session manager absolutizes against
 * `dispatchUrl`.
 */
export function agentToPdsClient(agent: BskyAppAgent): Client {
  const existing = pdsClients.get(agent)
  if (existing) {
    return existing
  }
  const client = createLexClient({
    get did() {
      return agent.did
    },
    fetchHandler: (path, init) => agent.sessionManager.fetchHandler(path, init),
  })
  pdsClients.set(agent, client)
  return client
}

/**
 * The chat {@link Client} for an agent, memoized per agent.
 *
 * Same session-manager transport as {@link agentToPdsClient} - authorization
 * and PDS routing, no agent-level proxy or labeler headers - but constructed
 * with {@link CHAT_PROXY_SERVICE} as its `service`, so lex-client emits
 * `atproto-proxy: <CHAT_PROXY_SERVICE>` on every request and `chat.bsky.*`
 * calls are proxied to the chat service.
 */
export function agentToChatClient(agent: BskyAppAgent): Client {
  const existing = chatClients.get(agent)
  if (existing) {
    return existing
  }
  const client = createLexClient(
    {
      get did() {
        return agent.did
      },
      fetchHandler: (path, init) =>
        agent.sessionManager.fetchHandler(path, init),
    },
    {service: CHAT_PROXY_SERVICE},
  )
  chatClients.set(agent, client)
  return client
}

/** Thrown when a write/auth-only client is used with no active session. */
export class NotAuthenticatedError extends Error {
  constructor(op = 'this operation') {
    super(`Not authenticated: ${op} requires an active session`)
    this.name = 'NotAuthenticatedError'
  }
}

let unauthedClient: Client | undefined

/**
 * A {@link Client} that throws {@link NotAuthenticatedError} on any request,
 * before any network I/O. It is the logged-out value of the write/auth-only
 * hooks (`usePdsClient`/`useChatClient`) so an unauthenticated call fails
 * immediately and legibly instead of silently hitting public infrastructure,
 * which would answer with an opaque 4xx.
 *
 * A single module-level instance, so its identity is stable across renders -
 * safe to use in React Query keys and as a hook return value.
 */
export function getUnauthenticatedThrowingClient(): Client {
  return (unauthedClient ??= createLexClient({
    did: undefined,
    fetchHandler: () => {
      throw new NotAuthenticatedError()
    },
  }))
}

let publicLexClient: Client | undefined

/**
 * The unauthenticated {@link Client} for public reads, pointed at the public
 * appview.
 *
 * A single module-level instance for the same identity-stability reason as
 * {@link agentToAppviewClient}: there is no session to scope it to, so it lives
 * for the lifetime of the process. Requests go through
 * {@link networkAwareFetch} so public reads feed the app's reachability signal
 * like authenticated ones do.
 *
 * Unlike the public agent it parallels, this client sends neither
 * `atproto-proxy` nor `atproto-accept-labelers`. `createPublicAgent` configures
 * the app labeler and the proxy header, so a logged-out appview *agent* read
 * does carry labelers while the same read through this client does not. A
 * consumer that needs moderation labels on public reads must configure labelers
 * itself before issuing the request.
 */
export function getPublicAppviewClient(): Client {
  return (publicLexClient ??= createLexClient({
    service: PUBLIC_BSKY_SERVICE,
    fetch: networkAwareFetch,
  }))
}
