import {File} from 'expo-file-system'

import {type CompressedVideo} from '#/lib/media/video/types'
import {type ChunkReader} from './types'

/**
 * Native chunk reader. Opens one file handle and seeks per read, so the video
 * bytes are never all held in JS memory. Call `close` when the upload finishes.
 */
export function createChunkReader(video: CompressedVideo): ChunkReader {
  const handle = new File(video.uri).open()
  return {
    read(offset, size) {
      /*
       * Must be sync: `readBytes()` is async and reads from wherever the
       * offset is when it runs, and concurrent part uploads share this handle.
       */
      handle.offset = offset
      return Promise.resolve(handle.readBytesSync(size))
    },
    close() {
      handle.close()
    },
  }
}
