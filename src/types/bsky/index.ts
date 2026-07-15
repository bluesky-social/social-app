import {
  getMain,
  type InferInput,
  type InferOutput,
  type Main,
  type ParseOptions,
  type RecordSchema,
  type Schema,
  type TypedObjectSchema,
  type ValidateOptions,
  type ValidationResult,
} from '@atproto/lex'
import {type ValidationResult as LegacyValidationResult} from '@atproto/lexicon'

export * as post from '#/types/bsky/post'
export * as profile from '#/types/bsky/profile'
export * as starterPack from '#/types/bsky/starterPack'

/**
 * Fast type checking without full schema validation, for use with data we
 * trust, or for non-critical path use cases. Why? Our SDK's `is*` identity
 * utils do not assert the type of the entire object, only the `$type` string.
 *
 * For full validation of the object schema, use the `validate` export from
 * this file.
 *
 * Usage:
 * ```ts
 * import * as bsky from '#/types/bsky'
 *
 * if (bsky.dangerousIsType<AppBskyFeedPost.Record>(item, AppBskyFeedPost.isRecord)) {
 *   // `item` has type `$Typed<AppBskyFeedPost.Record>` here
 * }
 * ```
 */
export function dangerousIsType<R extends {$type?: string}>(
  record: unknown,
  identity: <V>(v: V) => v is V & {$type: NonNullable<R['$type']>},
): record is R {
  return identity(record)
}

/**
 * Fully validates the object schema, which has a performance cost.
 *
 * For faster checks with data we trust, like that from our app view, use the
 * `dangerousIsType` export from this same file.
 *
 * Usage:
 * ```ts
 * import * as bsky from '#/types/bsky'
 *
 * if (bsky.validate(item, AppBskyFeedPost.validateRecord)) {
 *   // `item` has type `$Typed<AppBskyFeedPost.Record>` here
 * }
 * ```
 */
export function validate<R extends {$type?: string}>(
  record: unknown,
  validator: (v: unknown) => LegacyValidationResult<R>,
): record is R {
  return validator(record).success
}

/*
 * New-world helpers (below) operate on the generated lexicon schema objects
 * from '#/lexicons', replacing the `@atproto/api`-based helpers above.
 *
 * The old helpers take a record plus a standalone `is*`/`validate*` function
 * (e.g. `AppBskyFeedPost.isRecord`). The new codegen instead attaches the
 * validation surface directly to each schema, so these helpers take the schema
 * object itself:
 *
 * ```ts
 * import {app} from '#/lexicons'
 * import * as bsky from '#/types/bsky'
 *
 * // old: bsky.dangerousIsType(v, AppBskyFeedPost.isRecord)
 * bsky.isType(app.bsky.feed.post, v)
 *
 * // old: bsky.validate(v, AppBskyFeedPost.validateRecord)
 * bsky.matches(app.bsky.feed.post, v)
 * ```
 *
 * Every generated namespace module (e.g. `app.bsky.feed.post`) re-exports its
 * `main` schema, and bare defs (e.g. `app.bsky.feed.defs.postView`) are schema
 * objects directly. Both forms are accepted here - `getMain` unwraps a module
 * to its `main` schema and passes a bare schema through unchanged - so call
 * sites can pass whichever is in scope.
 */

/**
 * A generated lexicon schema that carries a `$type` and therefore supports the
 * fast, `$type`-only {@link isType} check: a record schema (`app.bsky.feed.post`)
 * or a typed-object def schema (`app.bsky.feed.defs.postView`).
 */
type TypedSchema = RecordSchema | TypedObjectSchema

/**
 * Fast type checking without full schema validation, for use with data we
 * trust, or for non-critical path use cases. This only compares the `$type`
 * string; it does NOT assert the rest of the object matches the schema. An
 * invalid record with the right `$type` will pass.
 *
 * This is the '#/lexicons' equivalent of {@link dangerousIsType}. For full
 * validation of the object schema, use {@link matches}, {@link parse}, or
 * {@link safeParse} from this same file.
 *
 * Usage:
 * ```ts
 * import {app} from '#/lexicons'
 * import * as bsky from '#/types/bsky'
 *
 * if (bsky.isType(app.bsky.feed.post, item)) {
 *   // `item` is narrowed to the post record type here
 * }
 * ```
 */
export function isType<S extends TypedSchema>(
  schema: Main<S>,
  value: unknown,
): value is InferInput<S> {
  /*
   * Deliberately NOT delegating to the schema's `isTypeOf`: the generated
   * `TypedObjectSchema.isTypeOf` treats a MISSING `$type` as a match
   * (maybe-typed semantics), which would let any plain object satisfy any
   * def-schema check and break `$type`-discriminated unions. The old
   * `dangerousIsType` required a present, matching `$type`, and so do we.
   * The nullish/object guard also mirrors the old `is$typed` behavior of
   * returning false (not throwing) for null/undefined input.
   */
  return (
    value != null &&
    typeof value === 'object' &&
    (value as {$type?: unknown}).$type === getMain(schema).$type
  )
}

/**
 * Fully validates the object against the schema (strict, no coercion), which
 * has a performance cost, and narrows the value on success.
 *
 * This is the '#/lexicons' equivalent of {@link validate}. For faster checks
 * with data we trust, like that from our app view, use {@link isType} from this
 * same file.
 *
 * Usage:
 * ```ts
 * import {app} from '#/lexicons'
 * import * as bsky from '#/types/bsky'
 *
 * if (bsky.matches(app.bsky.feed.post, item)) {
 *   // `item` is narrowed to the post record type here
 * }
 * ```
 */
export function matches<S extends Schema>(
  schema: Main<S>,
  value: unknown,
  options?: ValidateOptions,
): value is InferInput<S> {
  return getMain(schema).matches(value, options)
}

/**
 * Fully validates and parses the value against the schema, returning the typed
 * value or throwing an `LexValidationError` on failure. Parsing may apply
 * schema transformations such as default values.
 *
 * Prefer {@link safeParse} where you want to branch on failure without a
 * try/catch, or {@link matches} where you only need a type guard.
 *
 * Usage:
 * ```ts
 * import {app} from '#/lexicons'
 * import * as bsky from '#/types/bsky'
 *
 * const record = bsky.parse(app.bsky.feed.post, item) // typed, or throws
 * ```
 */
export function parse<S extends Schema>(
  schema: Main<S>,
  value: unknown,
  options?: ParseOptions,
): InferOutput<S> {
  return getMain(schema).parse(value, options)
}

/**
 * Fully validates and parses the value against the schema, returning a
 * discriminated `ValidationResult` instead of throwing. Parsing may apply
 * schema transformations such as default values.
 *
 * Usage:
 * ```ts
 * import {app} from '#/lexicons'
 * import * as bsky from '#/types/bsky'
 *
 * const result = bsky.safeParse(app.bsky.feed.post, item)
 * if (result.success) {
 *   // `result.value` is the typed post record
 * } else {
 *   // `result.reason` is the LexValidationError
 * }
 * ```
 */
export function safeParse<S extends Schema>(
  schema: Main<S>,
  value: unknown,
  options?: ParseOptions,
): ValidationResult<InferOutput<S>> {
  return getMain(schema).safeParse(value, options)
}
