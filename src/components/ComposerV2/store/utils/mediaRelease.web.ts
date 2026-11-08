/** Web: `compressImage` always returns a freshly created object URL. */
export function releaseCompressedImage({uri}: {uri: string}) {
  URL.revokeObjectURL(uri)
}

/**
 * Web: encoded output lives in `bytes` and its `uri` is the original source,
 * which the caller owns. Nothing to release.
 */
export function releaseCompressedVideo(_: {uri: string}) {}

/**
 * Web: the shared metadata helper creates a fresh object URL for each probe.
 * That contract, not the `blob:` prefix, makes it ours to revoke.
 */
export function releaseVideoProbeUri({uri}: {uri: string}) {
  URL.revokeObjectURL(uri)
}
