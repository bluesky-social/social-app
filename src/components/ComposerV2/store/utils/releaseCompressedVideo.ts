import {safeDeleteAsync} from '#/lib/media/manip'

/**
 * Native: an encoded compressor output is a new temp file the worker owns.
 * The worker never passes pass-through or GIF results, which alias the source.
 */
export function releaseCompressedVideo({uri}: {uri: string}) {
  return safeDeleteAsync(uri)
}
