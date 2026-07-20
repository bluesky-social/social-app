import {type Client} from '@atproto/lex'
import {type PasswordSession} from '@atproto/lex-password-session'

import {
  BLUESKY_PROXY_HEADER,
  CHAT_PROXY_SERVICE,
  PUBLIC_BSKY_SERVICE,
} from '#/lib/constants'
import {createLexClient} from '#/lib/lexClient'
import {networkAwareFetch} from './session-core'

/**
 * Lazily-constructed unauthenticated client pointed at the public appview. It
 * hits {@link PUBLIC_BSKY_SERVICE} directly, so no proxying is required.
 */
let publicClient: Client | undefined

export function getPublicLexClient(): Client {
  /*
   * Pass networkAwareFetch so the unauthenticated public path feeds the same
   * reachability signal as the session-backed clients (see session-core).
   */
  publicClient ??= createLexClient({
    service: PUBLIC_BSKY_SERVICE,
    fetch: networkAwareFetch,
  })
  return publicClient
}

/**
 * Build the chat client over a {@link PasswordSession}.
 *
 * {@link CHAT_PROXY_SERVICE} (`${CHAT_PROXY_DID}#bsky_chat`, default
 * `did:web:api.bsky.chat#bsky_chat`) is passed as the client's `service`, so
 * lex-client sets `atproto-proxy: <that value>` on every request and
 * `chat.bsky.*` calls are proxied to the chat service. The DID is read from the
 * env-configurable `CHAT_PROXY_DID` (via `EXPO_PUBLIC_CHAT_PROXY_DID`) rather
 * than the hard-coded SDK constant, so it can be retargeted per environment.
 */
export function buildChatClient(session: PasswordSession): Client {
  return createLexClient(session, {service: CHAT_PROXY_SERVICE})
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
 * request, before any network I/O. Used as the logged-out value of the
 * write/auth-only hooks (`usePdsClient`/`useChatClient`) so an unauthenticated
 * call fails immediately and legibly instead of silently hitting the public
 * appview (which would 404/405 with an opaque error).
 *
 * A lazily-constructed process-wide singleton, so its identity is stable across
 * renders - safe to use in React Query keys and as a hook return value.
 */
let unauthedClient: Client | undefined

export function getUnauthenticatedClient(): Client {
  unauthedClient ??= createLexClient({
    did: undefined,
    fetchHandler: () => {
      throw new NotAuthenticatedError()
    },
  })
  return unauthedClient
}

/**
 * Build the single authed Bluesky client over a {@link PasswordSession}. This
 * is the merged account-plus-appview client: one instance serves both reads
 * (proxied to the Bluesky appview) and writes (routed to the user's PDS),
 * because lex-client 0.3.0's record helpers pick the target per call.
 *
 * The instance is configured with `service = BLUESKY_PROXY_HEADER.get()`, so by
 * default every request carries the `atproto-proxy` header and is proxied to
 * the Bluesky appview, along with the per-instance labelers. The getter exists
 * so the e2e `TestCtrls` hack can retarget the appview via
 * `BLUESKY_PROXY_HEADER.set()` before sign-in (the client is built at sign-in,
 * so it picks up the override).
 *
 * Two request shapes take DIFFERENT targets off this one instance:
 *  - Record helpers (`createRecord`/`putRecord`/...) and the typed record sugar
 *    (`create`/`put`/`get`/`delete`/`list`) default per-call `service = null`
 *    in lex-client 0.3.0, which DELETES the `atproto-proxy` header regardless of
 *    the instance default. So writes auto-target the account host and hit the
 *    user's PDS through the session's `fetchHandler` (which resolves the PDS
 *    origin per request from the didDoc, falling back to `service`).
 *  - Raw `client.call(lexicon, ...)` inherits the appview proxy from the
 *    instance `service`, UNLESS the call site passes `{service: null}` to strip
 *    it (needed for `com.atproto.server`/`identity`/`sync`/`temp` calls that
 *    must hit the PDS directly).
 *
 * The Bluesky moderation labeler (`api.moderation.did`) is deliberately NOT
 * listed in `labelerDids` - it must flow only through the global
 * `Client.appLabelers` (see moderation.ts) so it carries the `;redact` suffix;
 * adding it here would produce a duplicate, non-redact header entry.
 *
 * We intentionally do NOT pass `fetch` here: a client built over a session uses
 * that session's own `fetch` (networkAwareFetch, set at construction).
 */
export function buildBskyClient(
  session: PasswordSession,
  labelerDids: string[],
): Client {
  return createLexClient(session, {
    service: BLUESKY_PROXY_HEADER.get(),
    labelers: labelerDids as `did:${string}:${string}`[],
  })
}

/**
 * Unauthenticated lex {@link Client} for public appview reads. A process-wide
 * singleton, so its identity is stable across renders.
 */
export function usePublicLexClient(): Client {
  return getPublicLexClient()
}
