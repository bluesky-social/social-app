export * as profile from '#/types/atproto/profile'
export * as starterPack from '#/types/atproto/starterPack'

/**
 * Use sparingly, and only when you know it's safe to do so.
 *
 * Our SDK's `is*` identity utils do not assert the type of the entire object,
 * and although the `isValid*` utils do, they also fully validate the object
 * shape, which has a performance cost. This util allows us to prescribe the
 * type we expect, while only checking the `$type` value of the record.
 *
 * Usage:
 * ```ts
 * import * as atp from '#/types/atproto'
 *
 * if (atp.dangerousIsType<AppBskyFeedPost.Record>(item, AppBskyFeedPost.isRecord)) {
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
