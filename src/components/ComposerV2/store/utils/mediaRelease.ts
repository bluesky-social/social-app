import {safeDeleteAsync} from '#/lib/media/manip'

/**
 * Native: `compressImage` always writes a new file into the composer cache
 * directory, so the selected output is ours to delete.
 */
export function releaseCompressedImage({uri}: {uri: string}) {
  return safeDeleteAsync(uri)
}

/**
 * Native: an encoded compressor output is a new temp file the worker owns.
 * The worker never passes pass-through or GIF results, which alias the source.
 */
export function releaseCompressedVideo({uri}: {uri: string}) {
  return safeDeleteAsync(uri)
}

/**
 * Native: the metadata helper returns the source URI it was given, which the
 * caller owns, so there is nothing to release.
 */
export function releaseVideoProbeUri(_: {uri: string}) {}
