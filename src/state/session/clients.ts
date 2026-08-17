import {type Agent, type Client} from '@atproto/lex'
import {type PasswordSession} from '@atproto/lex-password-session'

import {
  BLUESKY_PROXY_HEADER,
  CHAT_PROXY_SERVICE,
  PUBLIC_BSKY_SERVICE,
} from '#/lib/constants'
import {createLexClient} from '#/lib/lexClient'
import {getCachedIsBetaUser} from '#/state/preferences/beta-user-cache'
import {networkAwareFetch} from './network'

const IS_BETA_USER_HEADER = 'X-Bsky-Is-Beta-User'

/**
 * Add account-scoped headers to appview requests.
 *
 * Values are read from memory per request so preference changes are reflected
 * immediately without rebuilding the session bundle.
 */
function withAppviewRequestHeaders(agent: Agent): Agent {
  return {
    get did() {
      return agent.did
    },
    fetchHandler(path, init) {
      const headers = new Headers(init?.headers)
      const isBetaUser = agent.did ? getCachedIsBetaUser(agent.did) : undefined
      if (isBetaUser !== undefined) {
        headers.set(IS_BETA_USER_HEADER, String(isBetaUser))
      }
      return agent.fetchHandler(path, {...init, headers})
    },
  }
}

/**
 * Build the signed-in appview {@link Client}.
 *
 * {@link BLUESKY_PROXY_HEADER} is passed as the client's `service`, so lex sets
 * `atproto-proxy: <that value>` on every request and raw calls are proxied to
 * the appview. Record helpers force `service: null`, so they still target the
 * account host.
 *
 * The class-wide `Client.appLabelers` static is deliberately NOT suppressed
 * here: this client is the only producer of `atproto-accept-labelers` on an
 * appview request now that no agent sits underneath it. The account's own
 * subscriptions arrive separately, through `applyLabelersToClient` on the
 * instance, and that function filters out the Bluesky moderation DID so the
 * globally redacted authority is not also listed unredacted.
 *
 * No `fetch` option: a client built over a session uses that session's own
 * fetch, which is `networkAwareFetch` wrapped in the disposal kill switch.
 */
export function buildAppviewClient(agent: Agent): Client {
  return createLexClient(withAppviewRequestHeaders(agent), {
    service: BLUESKY_PROXY_HEADER.get(),
  })
}

/**
 * Build the signed-in account-host {@link Client}.
 *
 * No `service`, so no proxy header: `com.atproto.*` repo, server and identity
 * calls reach the account's own PDS rather than being proxied onward.
 *
 * `appLabelers: null` suppresses the class-wide static for this instance. A PDS
 * request is not an appview read, so it must carry no moderation authorities at
 * all; without the suppression it would start emitting the global list.
 */
export function buildPdsClient(agent: Agent): Client {
  return createLexClient(agent, {appLabelers: null})
}

/**
 * Build the signed-in chat {@link Client}.
 *
 * {@link CHAT_PROXY_SERVICE} (`${CHAT_PROXY_DID}#bsky_chat`, default
 * `did:web:api.bsky.chat#bsky_chat`) is the client's `service`, so `chat.bsky.*`
 * calls are proxied to the chat service. The DID is read from the
 * env-configurable `CHAT_PROXY_DID` rather than a hard-coded constant, so it can
 * be retargeted per environment.
 *
 * `appLabelers: null` for the same reason as the PDS client: the chat service
 * takes no moderation authorities.
 */
export function buildChatClient(agent: Agent): Client {
  return createLexClient(agent, {
    appLabelers: null,
    service: CHAT_PROXY_SERVICE,
  })
}

/**
 * Wrap a session so requests resolve against a known PDS while auth and refresh
 * stay with the session.
 *
 * This exists for the pre-didDoc window. `PasswordSession` resolves each request
 * against `extractPdsUrl(didDoc) ?? service`, so before a refresh has delivered
 * a didDoc it falls back to the login service - which for an entryway account
 * (`service: bsky.social`, PDS elsewhere) is the wrong host. The synchronous
 * resume fast path makes no network request at all, so that window covers every
 * request of a cold start until something triggers a refresh.
 *
 * Absolutizing here is enough because `PasswordSession.fetchHandler` builds its
 * URL with `new URL(path, base)`, which ignores the base for an already-absolute
 * input. So an absolute URL passes through untouched, and the session's own
 * didDoc routing still wins for any client built directly over it.
 *
 * The tradeoff is that this pins the STORED url for the bundle's lifetime, where
 * the session would prefer a didDoc endpoint that arrived later. That is
 * acceptable because the two only disagree if the account's PDS moved, and the
 * next cold start persists (and therefore pins) the new endpoint.
 */
export function routeSessionToPds(
  session: PasswordSession,
  pdsUrl: string,
): Agent {
  return {
    get did() {
      return session.did
    },
    fetchHandler(path, init) {
      return session.fetchHandler(new URL(path, pdsUrl).href, init)
    },
  }
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
 * A single module-level instance: there is no session to scope it to, so it
 * lives for the lifetime of the process, and its identity is therefore stable
 * enough for a React Query key. Requests go through {@link networkAwareFetch} so
 * public reads feed the app's reachability signal like authenticated ones do.
 *
 * Like the session appview client, it carries the class-wide
 * `Client.appLabelers`, so a logged-out read gets the same `;redact` moderation
 * authorities an authenticated one does. That makes `configureModerationForGuest`
 * load-bearing rather than test-only - it is what populates the static before
 * this client's first request, and `createPublicSessionBundle` runs it while
 * building the bundle.
 */
export function getPublicAppviewClient(): Client {
  return (publicLexClient ??= createLexClient({
    service: PUBLIC_BSKY_SERVICE,
    fetch: networkAwareFetch,
  }))
}
