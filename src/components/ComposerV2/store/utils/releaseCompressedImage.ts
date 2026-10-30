import {safeDeleteAsync} from '#/lib/media/manip'

/**
 * Native: `compressImage` always writes a new file into the composer cache
 * directory, so the selected output is ours to delete.
 */
export function releaseCompressedImage({uri}: {uri: string}) {
  return safeDeleteAsync(uri)
}
