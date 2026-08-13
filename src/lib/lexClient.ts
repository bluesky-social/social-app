import {
  type Agent,
  type AgentOptions,
  Client,
  type ClientOptions,
} from '@atproto/lex'

/**
 * App-standard factory for lex {@link Client}s. Use this instead of `new
 * Client(...)` so every client shares the same lenient response processing.
 *
 * lex-client defaults to strict Lex processing, which rejects responses
 * containing the LEGACY blob reference format (objects with `cid` and
 * `mimeType` properties instead of `$type: 'blob'`). Older records on the
 * network still carry these, and rejecting them would drop records the app
 * currently renders. Lenient mode also relaxes datetime format checks (e.g.
 * missing timezones) and blob MIME/size constraints. `Client.configure` only
 * accepts `appLabelers` globally, so the option is defaulted here, per
 * constructed client.
 */
export function createLexClient(
  agent: Agent | AgentOptions,
  options?: ClientOptions,
): Client {
  return new Client(agent, {strictResponseProcessing: false, ...options})
}

/**
 * An unauthenticated {@link Client} pointed at an arbitrary service URL, for
 * the PRE-AUTH flows that talk to a host the user typed or picked (hosting
 * provider description, password reset, handle availability). Those requests
 * cannot go through a session-scoped client, because there is no session yet.
 *
 * Deliberately NOT memoized: `service` is user-supplied and changes as the user
 * edits it, so there is no stable key to cache on. Each call builds a fresh
 * client, mirroring the ad-hoc agents these call sites constructed inline. That
 * keeps client identity per-render, so callers must not put the returned client
 * in a React Query key or a dependency array.
 *
 * Requests use PLAIN `fetch`, not `networkAwareFetch`: the host is untrusted
 * input, and a typo'd or dead service must not be reported as the app losing
 * network reachability.
 *
 * `appLabelers: null` suppresses the global `Client.appLabelers` static: these
 * are `com.atproto.server` calls to a host the user typed, which have no use
 * for moderation labels, and the header would disclose the app's configured
 * moderation authorities to an arbitrary third-party server.
 */
export function createServiceClient(service: string): Client {
  return createLexClient({service}, {appLabelers: null})
}
