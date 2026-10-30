/**
 * Web: encoded output lives in `bytes` and its `uri` is the original source,
 * which the caller owns. Nothing to release.
 */
export function releaseCompressedVideo(_: {uri: string}) {}
