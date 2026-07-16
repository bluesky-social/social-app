import {type AtpAgent} from '@atproto/api'
import {Client} from '@atproto/lex-client'
import {type PasswordSession} from '@atproto/lex-password-session'
import {api} from '@bsky.app/sdk'

import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {networkAwareFetch} from './session-core'

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

export function getPublicLexClient(): Client {
  /*
   * Pass networkAwareFetch so the unauthenticated public path feeds the same
   * reachability signal as the session-backed clients (see session-core).
   */
  publicClient ??= new Client({
    service: PUBLIC_BSKY_SERVICE,
    fetch: networkAwareFetch,
  })
  return publicClient
}

/**
 * Build the account (PDS) client over a {@link PasswordSession}. Writes and
 * record mutations go here - no `atproto-proxy` header, so requests hit the
 * user's PDS directly (the session's `fetchHandler` resolves the PDS origin
 * per request from the didDoc, falling back to `service`).
 *
 * The session already owns its own `fetch` (networkAwareFetch, set at
 * construction), so we intentionally do NOT pass `fetch` here: a `Client`
 * built over an existing `Agent`/session uses that agent's fetch.
 */
export function buildAccountClient(session: PasswordSession): Client {
  return new Client(session)
}

/**
 * Build the chat client over a {@link PasswordSession}.
 *
 * `api.chat.service` (`did:web:api.bsky.chat#bsky_chat`) is passed as the
 * client's `service`, so lex-client sets `atproto-proxy: did:web:api.bsky.chat#bsky_chat`
 * on every request. This is exactly what the old per-call `DM_SERVICE_HEADERS`
 * did, once and centrally, so `chat.bsky.*` calls are proxied to the chat
 * service.
 */
export function buildChatClient(session: PasswordSession): Client {
  return new Client(session, {service: api.chat.service})
}

/** Thrown when a write/auth-only client is used with no active session. */
export class NotAuthenticatedError extends Error {
  constructor(op = 'this operation') {
    super(`Not authenticated: ${op} requires an active session`)
    this.name = 'NotAuthenticatedError'
  }
}

/**
 * A stable {@link Client} that throws {@link NotAuthenticatedError} on any
 * request, before any network I/O. Used as the logged-out value of write/auth
 * -only hooks (`usePdsClient`/`useChatClient`) so an unauthenticated write or
 * chat call fails immediately and legibly instead of silently hitting the
 * public appview (which would 404/405 with an opaque error).
 *
 * A lazily-constructed process-wide singleton, so its identity is stable across
 * renders - safe to use in React Query keys and as a hook return value. The
 * `did` is `undefined` (logged out) and the `fetchHandler` throws before
 * touching the network.
 */
let unauthedClient: Client | undefined

export function getUnauthenticatedClient(): Client {
  unauthedClient ??= new Client({
    did: undefined,
    fetchHandler: () => {
      throw new NotAuthenticatedError()
    },
  })
  return unauthedClient
}

/**
 * Build the authed appview client over a {@link PasswordSession}.
 *
 * Requests are proxied to the Bluesky appview (`atproto-proxy:
 * did:web:api.bsky.app#bsky_appview`) and carry the per-instance labelers.
 * The Bluesky moderation labeler (`api.moderation.did`) is always included as
 * a base labeler because sending ANY `atproto-accept-labelers` header replaces
 * the server-side default - so we must re-assert it to keep it active.
 */
export function buildAppviewClient(
  session: PasswordSession,
  labelerDids: string[],
): Client {
  return new Client(session, {
    service: api.app.service,
    /* labelerDids are validated DID strings; cast to the DidString template type */
    labelers: [
      api.moderation.did,
      ...labelerDids,
    ] as `did:${string}:${string}`[],
  })
}

/**
 * Unauthenticated lex {@link Client} for public appview reads. A process-wide
 * singleton, so its identity is stable across renders.
 */
export function usePublicLexClient(): Client {
  return getPublicLexClient()
}
