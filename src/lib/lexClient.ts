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
