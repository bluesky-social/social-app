import { type ValidationResult } from '@gander-social-atproto/lexicon'

export * as post from '#/types/gndr/post'
export * as profile from '#/types/gndr/profile'
export * as starterPack from '#/types/gndr/starterPack'

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
 * import * as gndr from '#/types/gndr'
 *
 * if (gndr.dangerousIsType<AppGndrFeedPost.Record>(item, AppGndrFeedPost.isRecord)) {
 *   // `item` has type `$Typed<AppGndrFeedPost.Record>` here
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
 * import * as gndr from '#/types/gndr'
 *
 * if (gndr.validate(item, AppGndrFeedPost.validateRecord)) {
 *   // `item` has type `$Typed<AppGndrFeedPost.Record>` here
 * }
 * ```
 */
export function validate<R extends {$type?: string}>(
  record: unknown,
  validator: (v: unknown) => ValidationResult<R>,
): record is R {
  return validator(record).success
}
