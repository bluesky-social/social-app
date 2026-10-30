/** Web: `compressImage` always returns a freshly created object URL. */
export function releaseCompressedImage({uri}: {uri: string}) {
  URL.revokeObjectURL(uri)
}
