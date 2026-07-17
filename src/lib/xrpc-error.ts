import {
  type InferMethodError,
  LexError,
  type Main,
  type Procedure,
  type Query,
  XrpcError,
  XrpcResponseError,
} from '@atproto/lex'

/**
 * True for an XRPC error from a lex `Client` (`@atproto/lex-client` `XrpcError`,
 * the abstract base of `XrpcResponseError`/`XrpcInvalidResponseError`/
 * `XrpcInternalError`).
 */
export function isXrpcError(e: unknown): e is XrpcError {
  return e instanceof XrpcError
}

/**
 * HTTP status, or undefined if not an XRPC error / no response. Only
 * `XrpcResponseError` (a server response) carries a status; the internal/fetch
 * lex errors do not.
 */
export function getErrorStatus(e: unknown): number | undefined {
  return e instanceof XrpcResponseError ? e.status : undefined
}

/**
 * The lexicon error code (`err.error`). Gated on `LexError` (the base of the
 * lex error hierarchy) rather than `XrpcError` so sibling `LexError` subclasses
 * that are NOT `XrpcError` also surface their `.error` - notably
 * `LexAuthFactorError` (`'AuthFactorTokenRequired'`), which `PasswordSession`
 * throws for email-2FA logins. Every `XrpcError` is a `LexError`, so all
 * existing call sites keep working.
 */
export function getErrorName(e: unknown): string | undefined {
  return e instanceof LexError ? e.error : undefined
}

/**
 * True when `e` is an XRPC error whose lexicon error code is `name`, with
 * `name` compile-time constrained to the errors DECLARED by `method`'s
 * lexicon. The typed replacement for the old generated error classes
 * (`e instanceof SomeNsid.SomeError`): a typo'd or undeclared name is a type
 * error instead of a silent never-match.
 *
 * `method` accepts the same value passed to `client.call` - either the
 * generated method namespace (`chat.bsky.convo.acceptConvo`) or its `.main`
 * schema - via lex's `Main<M>`.
 */
export function isXrpcErrorOf<M extends Procedure | Query>(
  method: Main<M>,
  e: unknown,
  name: NoInfer<InferMethodError<M>>,
): boolean {
  return isXrpcError(e) && e.error === name
}

/**
 * Read a response header off an XRPC error. Only `XrpcResponseError` carries a
 * response; its `.headers` is a WHATWG `Headers` object.
 */
export function getErrorHeader(e: unknown, name: string): string | undefined {
  return e instanceof XrpcResponseError
    ? (e.headers.get(name) ?? undefined)
    : undefined
}
