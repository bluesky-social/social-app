import {
  getMain,
  type InferMethodError,
  LexError,
  type Main,
  type Procedure,
  type Query,
  XrpcError,
  XrpcResponseError,
} from '@atproto/lex'

import {com} from '#/lexicons'

/**
 * True for an XRPC error from a lex `Client` (`XrpcError` is the abstract base
 * of `XrpcResponseError`/`XrpcInvalidResponseError`/`XrpcInternalError`).
 */
export function isXrpcError(e: unknown): e is XrpcError {
  return e instanceof XrpcError
}

/**
 * HTTP status, or undefined when `e` is not an XRPC error carrying a response.
 * Only `XrpcResponseError` (a genuine server response) has a status; the
 * internal/fetch lex errors do not.
 */
export function getErrorStatus(e: unknown): number | undefined {
  return e instanceof XrpcResponseError ? e.status : undefined
}

/**
 * The lexicon error code (`err.error`), or undefined when `e` carries none.
 * Gated on `LexError` (the base of every `XrpcError`) rather than `XrpcError`,
 * so the non-XRPC lex errors are covered too.
 *
 * Prefer {@link matchXrpcError} where the method that threw is known: it
 * constrains the compared name to that method's declared errors. Use this only
 * where the source method is genuinely ambiguous.
 */
export function getErrorName(e: unknown): string | undefined {
  return e instanceof LexError ? e.error : undefined
}

/**
 * Same nsid means `e` was thrown for this method schema, so `e` can be
 * treated as an `XrpcResponseError<M>` - which is what lets the SDK's
 * `matchesSchemaErrors()` narrow `e.error` to M's declared errors.
 */
function isThrownFor<M extends Procedure | Query>(
  e: XrpcResponseError,
  schema: M,
): e is XrpcResponseError<M> {
  return e.method.nsid === schema.nsid
}

/**
 * The lexicon error code carried by `e`, narrowed to the errors DECLARED by
 * `method`, or `undefined` when `e` is not such an error.
 *
 * `XrpcResponseError.error` is the open `LexErrorCode` union, so comparing it
 * as a plain string lets a typo silently never match. Narrowing the return type
 * to `InferMethodError<M>` makes a `switch` over the result reject an
 * undeclared or misspelled `case` at compile time:
 *
 * ```ts
 * switch (matchXrpcError(e, com.atproto.server.createAccount)) {
 *   case 'InvalidHandle':
 *     ...
 * }
 * ```
 *
 * Matching is scoped to `method`: `XrpcError` records the method schema it was
 * thrown for, so a declared code arriving from a DIFFERENT call does not match.
 * Undeclared codes, non-XRPC errors, and the internal/fetch lex errors (which
 * carry no server error code) all return `undefined`.
 *
 * `method` accepts the same value passed to `client.call` - either the
 * generated method namespace (`com.atproto.server.createAccount`) or its
 * `.main` schema - via lex's `Main<M>`.
 */
export function matchXrpcError<M extends Procedure | Query>(
  e: unknown,
  method: Main<M>,
): InferMethodError<M> | undefined {
  if (!(e instanceof XrpcResponseError)) {
    return undefined
  }
  const schema = getMain(method)
  if (isThrownFor(e, schema) && e.matchesSchemaErrors()) {
    return e.error
  }
  return undefined
}

/**
 * Whether `e` is a `com.atproto.repo.getRecord` failure meaning the record is
 * absent, so the caller can treat the read as "no record" instead of an error.
 *
 * `getRecord` declares `RecordNotFound` and both the PDS and the appview throw
 * it by that name, so the declared code is the primary check. The message
 * substring is kept as a fallback because that is what the pre-SDK call sites
 * matched on, and an older PDS in the network may still answer with an
 * unnamed error whose message carries the text. Dropping it would silently
 * turn a previously-handled absence into a thrown error.
 */
export function isRecordNotFoundError(e: unknown): boolean {
  if (matchXrpcError(e, com.atproto.repo.getRecord) === 'RecordNotFound') {
    return true
  }
  return e instanceof Error && e.message.includes('Could not locate record:')
}
