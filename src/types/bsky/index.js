export * as post from '#/types/bsky/post';
export * as profile from '#/types/bsky/profile';
export * as starterPack from '#/types/bsky/starterPack';
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
export function dangerousIsType(record, identity) {
    return identity(record);
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
export function validate(record, validator) {
    return validator(record).success;
}
