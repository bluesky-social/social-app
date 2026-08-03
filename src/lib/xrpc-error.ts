import {
  getMain,
  type InferMethodError,
  type Main,
  type Procedure,
  type Query,
  XrpcResponseError,
} from '@atproto/lex'

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
  const schema: Procedure | Query = getMain(method)
  const thrownFor: Procedure | Query = e.method
  if (thrownFor.nsid !== schema.nsid) {
    return undefined
  }
  return schema.errors?.includes(e.error)
    ? (e.error as InferMethodError<M>)
    : undefined
}
