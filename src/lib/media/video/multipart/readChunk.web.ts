import {type CompressedVideo} from '#/lib/media/video/types'
import {type ChunkReader} from './types'

/**
 * Web chunk reader. Web compression already produces the full buffer, so this
 * slices it in memory. Falls back to fetching the uri once if `bytes` is
 * missing. `close` is a no-op.
 */
export function createChunkReader(video: CompressedVideo): ChunkReader {
  let bytesPromise: Promise<ArrayBuffer> | null = null
  const getBytes = () => {
    if (video.bytes) {
      return Promise.resolve(video.bytes)
    }
    if (!bytesPromise) {
      bytesPromise = fetch(video.uri).then(res => res.arrayBuffer())
    }
    return bytesPromise
  }
  return {
    async read(offset, size) {
      const buffer = await getBytes()
      return new Uint8Array(buffer, offset, size)
    },
    close() {},
  }
}
