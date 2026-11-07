import {describe, expect, jest, test} from '@jest/globals'

import {type CompressedVideo} from '#/lib/media/video/types'
import {createRetainedCompressionCache} from '#/components/ComposerV2/store/utils/createRetainedCompressionCache'

const video = {
  uri: 'file:///c.mp4',
  mimeType: 'video/mp4',
  size: 1,
} as CompressedVideo

describe('createRetainedCompressionCache', () => {
  test('lease returns the retained video, or undefined without one', () => {
    const cache = createRetainedCompressionCache()
    expect(cache.lease({mediaId: 'a'})).toBeUndefined()
    cache.retain({mediaId: 'a', video})
    expect(cache.lease({mediaId: 'a'})?.video).toBe(video)
  })

  test('release waits for active leases once retired', () => {
    const release = jest.fn()
    const cache = createRetainedCompressionCache()
    const first = cache.retain({mediaId: 'a', video, release})
    const second = cache.lease({mediaId: 'a'})!
    cache.retire({mediaId: 'a'})
    expect(release).not.toHaveBeenCalled()
    first.release()
    expect(release).not.toHaveBeenCalled()
    second.release()
    expect(release).toHaveBeenCalledTimes(1)
  })

  test('does not offer a retired entry to later readers', () => {
    const cache = createRetainedCompressionCache()
    cache.retain({mediaId: 'a', video}).release()
    cache.retire({mediaId: 'a'})
    expect(cache.lease({mediaId: 'a'})).toBeUndefined()
  })

  test('lease release is idempotent', () => {
    const release = jest.fn()
    const cache = createRetainedCompressionCache()
    const held = cache.retain({mediaId: 'a', video, release})
    const other = cache.lease({mediaId: 'a'})!
    held.release()
    held.release()
    cache.retire({mediaId: 'a'})
    /* A double release must not drop the other reader's hold. */
    expect(release).not.toHaveBeenCalled()
    other.release()
    other.release()
    expect(release).toHaveBeenCalledTimes(1)
  })

  test('swallows cleanup errors', () => {
    const cache = createRetainedCompressionCache()
    const lease = cache.retain({
      mediaId: 'a',
      video,
      release: () => {
        throw new Error('disk')
      },
    })
    cache.retire({mediaId: 'a'})
    expect(() => lease.release()).not.toThrow()
  })

  test('retaining again retires the earlier entry', () => {
    const release = jest.fn()
    const cache = createRetainedCompressionCache()
    cache.retain({mediaId: 'a', video, release}).release()
    cache.retain({mediaId: 'a', video})
    expect(release).toHaveBeenCalledTimes(1)
  })

  test('invalidate retires only the leased entry', () => {
    const release = jest.fn()
    const cache = createRetainedCompressionCache()
    const old = cache.retain({mediaId: 'a', video, release})
    old.release()
    const fresh = cache.retain({mediaId: 'a', video})
    old.invalidate()
    expect(cache.lease({mediaId: 'a'})?.video).toBe(video)
    fresh.invalidate()
    expect(cache.lease({mediaId: 'a'})).toBeUndefined()
  })

  test('clear releases unleased entries and defers leased ones', () => {
    const idle = jest.fn()
    const busy = jest.fn()
    const cache = createRetainedCompressionCache()
    cache.retain({mediaId: 'idle', video, release: idle}).release()
    const lease = cache.retain({mediaId: 'busy', video, release: busy})
    cache.clear()
    expect(idle).toHaveBeenCalledTimes(1)
    expect(busy).not.toHaveBeenCalled()
    expect(cache.lease({mediaId: 'busy'})).toBeUndefined()
    lease.release()
    expect(busy).toHaveBeenCalledTimes(1)
  })
})
