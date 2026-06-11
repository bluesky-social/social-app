/**
 * Constants and types for Tangled "strings" — sharable code snippets/pastes on
 * atproto. See https://tangled.org. A string's code lives inline in the record
 * (`contents`), so a client only needs `com.atproto.repo.getRecord` to render
 * it — no blob fetch.
 */

export const STRING_COLLECTION = 'sh.tangled.string'

/**
 * Subset of the `sh.tangled.string` record we render. The record may carry more
 * fields; we only type what the card reads.
 */
export type TangledStringValue = {
  $type?: string
  /** The full snippet text, stored inline. */
  contents?: string
  /** e.g. `test.ts` — we infer the language from its extension. */
  filename?: string
  description?: string
  createdAt?: string
}
