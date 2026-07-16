import {XRPCError} from '@atproto/api'
import {XrpcError, XrpcResponseError} from '@atproto/lex-client'

/**
 * True for an XRPC error from either the old bridge agent (`@atproto/api`
 * `XRPCError`) or a lex `Client` (`@atproto/lex-client` `XrpcError`, the
 * abstract base of `XrpcResponseError`/`XrpcInvalidResponseError`/
 * `XrpcInternalError`). During the migration both worlds can throw, so matchers
 * must accept both.
 */
export function isXrpcError(e: unknown): e is XRPCError | XrpcError {
  return e instanceof XRPCError || e instanceof XrpcError
}

/**
 * HTTP status, or undefined if not an XRPC error / no response. Only lex
 * `XrpcResponseError` (a server response) carries a status; the internal/fetch
 * lex errors do not.
 */
export function getErrorStatus(e: unknown): number | undefined {
  if (e instanceof XRPCError) return e.status
  if (e instanceof XrpcResponseError) return e.status
  return undefined
}

/** The lexicon error code (`err.error`), from either world. */
export function getErrorName(e: unknown): string | undefined {
  if (isXrpcError(e)) return (e as {error?: string}).error
  return undefined
}

/**
 * Read a response header off an XRPC error, normalizing the shape change:
 * old XRPCError.headers is a plain record; lex XrpcResponseError.headers is a
 * WHATWG Headers object.
 */
export function getErrorHeader(e: unknown, name: string): string | undefined {
  if (e instanceof XrpcResponseError) return e.headers.get(name) ?? undefined
  if (e instanceof XRPCError) {
    const h = (e as {headers?: Record<string, string>}).headers
    return h?.[name.toLowerCase()]
  }
  return undefined
}
