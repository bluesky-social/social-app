import {type CompressedVideo} from '#/lib/media/video/types'
import {type CompressedVideoLease} from '#/components/ComposerV2/store/uploads'

/**
 * A completed video compression result kept so a retry can skip compression.
 * It lives outside `ThreadState`, which must not carry web byte buffers.
 */
type CompressionEntry = {
  video: CompressedVideo
  /**
   * Frees what the entry owns: a readable copy the output aliases, or a native
   * encoded output file. Absent for caller-owned files and web output.
   */
  release?: () => void
  /** Attempts still reading the output. Cleanup waits for them. */
  readers: number
  retired: boolean
}

export type RetainedCompressionCache = {
  /**
   * Leases the retained result for this media item, if any. The reader must
   * release the lease.
   */
  lease(args: {mediaId: string}): CompressedVideoLease | undefined
  /**
   * Retains a completed result for later attempts, replacing (and retiring)
   * any earlier one, and returns the caller's lease on it. A given `release`
   * is called once, after the entry is retired and every lease is released.
   */
  retain(args: {
    mediaId: string
    video: CompressedVideo
    release?: () => void
  }): CompressedVideoLease
  /**
   * Stops offering the media item's result to later attempts. Readers already
   * using it keep it until they release, so cancelling an attempt never
   * deletes an output a non-abortable step is still reading.
   */
  retire(args: {mediaId: string}): void
  /** Retires every entry. */
  clear(): void
}

/**
 * Compression results by media ID, for videos only. A video's source never
 * changes (a replacement is a new item with a new ID) and caption or alt text
 * edits do not affect compression, so the ID identifies a result. Callers
 * retire an entry when the item is removed, a processed blob supersedes it,
 * the item fails for good, or the session ends.
 */
export function createRetainedCompressionCache(): RetainedCompressionCache {
  const entries = new Map<string, CompressionEntry>()

  function cleanUp({entry}: {entry: CompressionEntry}) {
    if (!entry.retired || entry.readers > 0) return
    const {release} = entry
    entry.release = undefined
    try {
      release?.()
    } catch {
      /* A leftover cache file is harmless. */
    }
  }

  function leaseEntry({
    mediaId,
    entry,
  }: {
    mediaId: string
    entry: CompressionEntry
  }): CompressedVideoLease {
    entry.readers += 1
    let released = false
    return {
      video: entry.video,
      invalidate() {
        if (entries.get(mediaId) === entry) retire({mediaId})
      },
      release() {
        if (released) return
        released = true
        entry.readers -= 1
        cleanUp({entry})
      },
    }
  }

  function retire({mediaId}: {mediaId: string}) {
    const entry = entries.get(mediaId)
    if (!entry) return
    entries.delete(mediaId)
    entry.retired = true
    cleanUp({entry})
  }

  return {
    lease({mediaId}) {
      const entry = entries.get(mediaId)
      return entry && leaseEntry({mediaId, entry})
    },
    retain({mediaId, video, release}) {
      retire({mediaId})
      const entry = {video, release, readers: 0, retired: false}
      entries.set(mediaId, entry)
      return leaseEntry({mediaId, entry})
    },
    retire,
    clear() {
      for (const mediaId of [...entries.keys()]) retire({mediaId})
    },
  }
}
