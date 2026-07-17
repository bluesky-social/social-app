import {XrpcError, XrpcResponseError} from '@atproto/lex-client'

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

/** The lexicon error code (`err.error`). */
export function getErrorName(e: unknown): string | undefined {
  return isXrpcError(e) ? (e as {error?: string}).error : undefined
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
