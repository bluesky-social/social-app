import {LexError} from '@atproto/lex-client'

/**
 * The lexicon error code (`err.error`). Gated on `LexError` (the base of the
 * lex error hierarchy) rather than `XrpcError` so sibling `LexError` subclasses
 * that are NOT `XrpcError` also surface their `.error` - notably
 * `LexAuthFactorError` (`'AuthFactorTokenRequired'`), which `PasswordSession`
 * throws for email-2FA logins. Every `XrpcError` is a `LexError`, so gating on
 * the base covers server error responses too.
 */
export function getErrorName(e: unknown): string | undefined {
  return e instanceof LexError ? e.error : undefined
}
