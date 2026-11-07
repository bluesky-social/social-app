import {beforeEach, describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => {
  class EmbeddingDisabledError extends Error {}
  return {resolveLink: jest.fn(), EmbeddingDisabledError}
})

import {type LinkResolvers, type resolveLink} from '#/lib/api/resolve'
import {type PickerImage} from '#/lib/media/picker.shared'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type AddMediaInput,
  type PostMediaItem,
  type UploadStatus,
} from '#/components/ComposerV2/store/types'
import {
  type ImageUploadDependencies,
  type UploadWorkerOverrides,
} from '#/components/ComposerV2/store/uploads'
import {type Gif} from '#/features/gifPicker/types'
import {
  flush,
  manualUploadWorkers,
  realUploadWorkers,
  reportAnyStatus,
  testUploadRuntime,
} from './uploadTestUtils'

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

const resolvers = {} as LinkResolvers

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

function getMedia(
  store: ReturnType<typeof createThreadStore>,
  postId: string,
): PostMediaItem[] {
  const media = store.getState().posts[postId].attachments.media
  if (media?.state !== 'resolved') return []
  if (media.kind === 'images') return media.items
  if (media.kind === 'video' || media.kind === 'gif') return [media.item]
  return []
}

function getUploadState(
  store: ReturnType<typeof createThreadStore>,
  postId: string,
) {
  const item = getMedia(store, postId)[0]
  return item && item.kind !== 'gif' ? item.upload.state : undefined
}

const imageInput: AddMediaInput = {
  kind: 'image',
  uri: 'file:///tmp/a.jpg',
  width: 100,
  height: 100,
}

const videoInput: AddMediaInput = {
  kind: 'video',
  uri: 'file:///tmp/a.mp4',
  width: 1920,
  height: 1080,
  mimeType: 'video/mp4',
}

const gifInput: AddMediaInput = {
  kind: 'gif',
  // Tests don't read inside the gif, so a minimal cast is fine.
  gif: {url: 'https://example.com/g.gif'} as Gif,
}

// Embed-routing tests live in embeds.test.ts; here we just need a never-
// resolving resolveLink so any addUri-driven resolution doesn't crash and
// no result ever lands. The promise never settles, which is what we want.
let mockResolveLink: jest.Mock<typeof resolveLink>
/** Upload attempts the store started, driven by hand. Fresh per test. */
let manual: ReturnType<typeof manualUploadWorkers>

beforeEach(() => {
  mockResolveLink = jest.fn(
    () => new Promise(() => {}),
  ) as unknown as jest.Mock<typeof resolveLink>
  manual = manualUploadWorkers()
})

function makeStore() {
  return createThreadStore({
    defaultLanguages: [],
    ...testUploadRuntime,
    resolvers,
    __createId: makeIdGenerator(),
    __resolveLink: mockResolveLink,
    __uploadWorkers: manual.workers,
  })
}

test('keeps the low-level upload status setter on internal actions only', () => {
  const store = makeStore()

  expect('applyUploadStatus' in store.actions).toBe(false)
  expect(typeof store.internalActions.applyUploadStatus).toBe('function')
  expect(typeof store.internalActions.applyUploadFailure).toBe('function')
  // @ts-expect-error Upload status mutation is not a public composer command.
  void store.actions.applyUploadStatus

  store.destroy()
})

describe('stored upload failures', () => {
  test.each([
    {label: 'true', retryable: true},
    {label: 'false', retryable: false},
  ])('stores a worker failure with retryable $label', ({retryable}) => {
    const started: string[] = []
    let reportStatus: ((status: UploadStatus) => void) | undefined
    const store = createThreadStore({
      defaultLanguages: [],
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      initialState: {
        posts: [
          {
            attachments: {
              media: {
                kind: 'images',
                items: [{uri: imageInput.uri, width: 100, height: 100}],
              },
            },
          },
        ],
      },
      __uploadWorkers: {
        startImageUpload: opts => {
          started.push(opts.media.id)
          reportStatus = status =>
            reportAnyStatus({attempt: opts.attempt, status})
          return {cancel() {}}
        },
      },
    })
    const postId = rootId(store)
    const item = getMedia(store, postId)[0]
    if (item.kind !== 'image') throw new Error('expected image')
    expect(started).toEqual([item.id])

    const failure: UploadStatus = {
      state: 'failed',
      code: 'network',
      retryable,
    }
    reportStatus!(failure)

    const stored = getMedia(store, postId)[0]
    if (stored.kind !== 'image' || stored.upload.state !== 'failed') {
      throw new Error('expected failed image upload')
    }
    expect(stored.upload).toMatchObject({
      state: 'failed',
      code: 'network',
      retryable,
    })
    expect(store.getState().isDirty).toBe(false)
    expect(started).toEqual([item.id])

    if (!stored.upload.retryable) {
      const failedState = store.getState()
      store.actions.retryMediaUpload(postId, item.id)
      expect(store.getState()).toBe(failedState)
      expect(store.actions.retryAllFailedUploads()).toEqual({
        retriedMediaIds: [],
      })
      expect(started).toEqual([item.id])
    } else {
      store.actions.retryMediaUpload(postId, item.id)
      expect(getUploadState(store, postId)).toBe('pending')
      expect(started).toEqual([item.id, item.id])
      expect(store.getState().isDirty).toBe(false)
    }
    store.destroy()
  })
})

describe('addMedia', () => {
  test('adds a single image with pending upload status and returns its named id', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [imageInput])
    expect(ids).toEqual({addedMediaIds: ['id-2']})

    const media = getMedia(store, root)
    expect(media).toHaveLength(1)
    expect(media[0].kind).toBe('image')
    expect(media[0].id).toBe('id-2')
    expect(media[0].postId).toBe(root)
    if (media[0].kind !== 'image') throw new Error('expected image')
    expect(media[0].upload).toEqual({state: 'pending'})
  })

  test('preserves input order in returned ids and on the post', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [
      imageInput,
      imageInput,
      imageInput,
    ])
    expect(ids?.addedMediaIds).toHaveLength(3)
    expect(getMedia(store, root).map(m => m.id)).toEqual(ids?.addedMediaIds)
  })

  test('marks state dirty', () => {
    const store = makeStore()
    expect(store.getState().isDirty).toBe(false)
    store.actions.addMedia(rootId(store), [imageInput])
    expect(store.getState().isDirty).toBe(true)
  })

  test('returns undefined and is a no-op when post id is unknown', () => {
    const store = makeStore()
    const before = store.getState()
    const result = store.actions.addMedia('does-not-exist', [imageInput])
    expect(result).toBeUndefined()
    expect(store.getState()).toBe(before)
  })

  test('returns named empty ids for an empty input list and is a no-op', () => {
    const store = makeStore()
    const before = store.getState()
    const notify = jest.fn()
    store.subscribe(notify)
    const result = store.actions.addMedia(rootId(store), [])
    expect(result).toEqual({addedMediaIds: []})
    expect(store.getState()).toBe(before)
    expect(store.getState().isDirty).toBe(false)
    expect(notify).not.toHaveBeenCalled()
    expect(manual.attempts).toHaveLength(0)
  })

  test('does not start an upload task for a gif', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [gifInput])
    expect(manual.attempts).toHaveLength(0)
    const media = getMedia(store, root)
    expect(media[0].kind).toBe('gif')
    // Gif media records have no `upload` field.
    expect('upload' in media[0]).toBe(false)
  })
})

describe('addMedia input validation (first item dictates kind, cap by count)', () => {
  test('image-first: filters out non-images and caps at 10', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [
      imageInput,
      videoInput,
      gifInput,
      ...Array.from({length: 10}, () => imageInput),
    ])
    expect(ids?.addedMediaIds).toHaveLength(10)
    const media = getMedia(store, root)
    expect(media).toHaveLength(10)
    expect(media.every(m => m.kind === 'image')).toBe(true)
    expect(manual.attempts).toHaveLength(10)
  })

  test.each([4, 5, 10])('accepts %i images in order', count => {
    const store = makeStore()
    const root = rootId(store)
    const inputs = Array.from({length: count}, (_, i) => ({
      ...imageInput,
      uri: `file:///image-${i}.jpg`,
    }))
    const ids = store.actions.addMedia(root, inputs)
    const media = getMedia(store, root)
    expect(ids?.addedMediaIds).toHaveLength(count)
    expect(media.map(item => item.kind !== 'gif' && item.uri)).toEqual(
      inputs.map(input => input.uri),
    )
    expect(store.getState().posts[root].imageSelectionsRemaining).toBe(
      10 - count,
    )
  })

  test('video-first: filters out non-videos and caps at 1', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [
      videoInput,
      imageInput,
      videoInput,
    ])
    expect(ids?.addedMediaIds).toHaveLength(1)
    expect(getMedia(store, root)[0].kind).toBe('video')
  })

  test('gif-first: filters out non-gifs and caps at 1', () => {
    const store = makeStore()
    const root = rootId(store)
    const ids = store.actions.addMedia(root, [gifInput, gifInput, imageInput])
    expect(ids?.addedMediaIds).toHaveLength(1)
    expect(getMedia(store, root)[0].kind).toBe('gif')
  })
})

describe('addMedia respects existing media on the post', () => {
  test('appends images up to a total of 10 when the post already has images', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(
      root,
      Array.from({length: 8}, () => imageInput),
    )
    const ids = store.actions.addMedia(root, [
      imageInput,
      imageInput,
      imageInput,
    ])
    expect(ids?.addedMediaIds).toHaveLength(2)
    expect(getMedia(store, root)).toHaveLength(10)
  })

  test('drops non-image inputs when the post already has images', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput])
    const ids = store.actions.addMedia(root, [videoInput, gifInput])
    expect(ids).toEqual({addedMediaIds: []})
    expect(getMedia(store, root)).toHaveLength(1)
  })

  test('is a no-op when the post already has 10 images', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(
      root,
      Array.from({length: 10}, () => imageInput),
    )
    const before = store.getState()
    const ids = store.actions.addMedia(root, [imageInput])
    expect(ids).toEqual({addedMediaIds: []})
    expect(store.getState()).toBe(before)
  })

  test('is a no-op when the post already has a video', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [videoInput])
    const before = store.getState()
    const ids = store.actions.addMedia(root, [imageInput, gifInput])
    expect(ids).toEqual({addedMediaIds: []})
    expect(store.getState()).toBe(before)
  })

  test('is a no-op when the post already has a gif', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [gifInput])
    const before = store.getState()
    const ids = store.actions.addMedia(root, [imageInput, videoInput])
    expect(ids).toEqual({addedMediaIds: []})
    expect(store.getState()).toBe(before)
  })

  test('is a no-op when the post has an external link card', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    const before = store.getState()
    const ids = store.actions.addMedia(root, [imageInput])
    expect(ids).toEqual({addedMediaIds: []})
    expect(store.getState()).toBe(before)
  })
})

describe('selectionsRemaining flags on the post', () => {
  test('empty post starts with 10 / 1 / 1', () => {
    const store = makeStore()
    const post = store.getState().posts[rootId(store)]
    expect(post.imageSelectionsRemaining).toBe(10)
    expect(post.videoSelectionsRemaining).toBe(1)
    expect(post.gifSelectionsRemaining).toBe(1)
  })

  test('decrements as images are added', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput, imageInput])
    let post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(8)
    expect(post.videoSelectionsRemaining).toBe(0)
    expect(post.gifSelectionsRemaining).toBe(0)

    store.actions.addMedia(root, [imageInput, imageInput])
    expect(store.getState().posts[root].imageSelectionsRemaining).toBe(6)
    store.actions.addMedia(
      root,
      Array.from({length: 6}, () => imageInput),
    )
    post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(0)
  })

  test('a video locks all three counters to 0', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [videoInput])
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(0)
    expect(post.videoSelectionsRemaining).toBe(0)
    expect(post.gifSelectionsRemaining).toBe(0)
  })

  test('a gif locks all three counters to 0', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [gifInput])
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(0)
    expect(post.videoSelectionsRemaining).toBe(0)
    expect(post.gifSelectionsRemaining).toBe(0)
  })

  test('removing media restores capacity', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [imgId],
    } = store.actions.addMedia(root, [imageInput])!
    expect(store.getState().posts[root].imageSelectionsRemaining).toBe(9)
    store.actions.removeMedia(root, imgId)
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(10)
    expect(post.videoSelectionsRemaining).toBe(1)
    expect(post.gifSelectionsRemaining).toBe(1)
  })

  test('an external link card locks all three counters to 0', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(0)
    expect(post.videoSelectionsRemaining).toBe(0)
    expect(post.gifSelectionsRemaining).toBe(0)
  })

  test('removing the external link card restores capacity', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addUri(root, 'https://example.com')
    store.actions.removeMediaAttachment(root)
    const post = store.getState().posts[root]
    expect(post.imageSelectionsRemaining).toBe(10)
    expect(post.videoSelectionsRemaining).toBe(1)
    expect(post.gifSelectionsRemaining).toBe(1)
  })
})

describe('removeMedia', () => {
  test('removes the matching media and leaves others intact', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [a, b],
    } = store.actions.addMedia(root, [imageInput, imageInput])!

    store.actions.removeMedia(root, a)
    expect(getMedia(store, root).map(m => m.id)).toEqual([b])
  })

  test('cancels in-flight upload (no further status writes after removal)', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [imageId],
    } = store.actions.addMedia(root, [imageInput])!
    const [attempt] = manual.attempts
    attempt.report({state: 'uploading', progress: 0.25})
    store.actions.removeMedia(root, imageId)
    expect(attempt.cancel).toHaveBeenCalled()
    const after = store.getState()
    attempt.report({state: 'uploaded', blob: {} as never})
    expect(store.getState()).toBe(after)
    expect(getMedia(store, root)).toHaveLength(0)
  })

  test('is a no-op when media id is unknown', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput])
    const before = store.getState()
    store.actions.removeMedia(root, 'does-not-exist')
    expect(store.getState()).toBe(before)
  })
})

describe('retryMediaUpload', () => {
  test.each([imageInput, videoInput])(
    'does not restart pending, uploading, or uploaded $kind work',
    input => {
      for (const status of [
        {state: 'pending'},
        {state: 'uploading', progress: 0.5},
        {state: 'uploaded', blob: {} as never},
      ] satisfies UploadStatus[]) {
        const {attempts, workers} = manualUploadWorkers()
        const store = createThreadStore({
          defaultLanguages: [],
          ...testUploadRuntime,
          resolvers,
          __createId: makeIdGenerator(),
          __uploadWorkers: workers,
        })
        const postId = rootId(store)
        const {
          addedMediaIds: [mediaId],
        } = store.actions.addMedia(postId, [input])!
        attempts[0].report(status)
        const before = store.getState()
        const notify = jest.fn()
        store.subscribe(notify)

        store.actions.retryMediaUpload(postId, mediaId)
        expect(store.getState()).toBe(before)
        expect(attempts).toHaveLength(1)
        expect(attempts[0].cancel).not.toHaveBeenCalled()
        expect(notify).not.toHaveBeenCalled()
        store.destroy()
      }
    },
  )

  test.each([imageInput, videoInput])(
    'retryMediaUpload only restarts a current retryable $kind failure',
    input => {
      const {attempts, workers} = manualUploadWorkers()
      const store = createThreadStore({
        defaultLanguages: [],
        ...testUploadRuntime,
        resolvers,
        __createId: makeIdGenerator(),
        __uploadWorkers: workers,
      })
      const postId = rootId(store)
      const {
        addedMediaIds: [mediaId],
      } = store.actions.addMedia(postId, [input])!
      attempts[0].report({
        state: 'failed',
        code: 'network',
        retryable: true,
      })
      // Editing the item does not supersede its failed upload.
      store.actions.updateMediaAltText(postId, mediaId, 'edited alt')
      store.actions.retryMediaUpload(postId, mediaId)
      expect(attempts).toHaveLength(2)
      const pending = store.getState()
      store.actions.retryMediaUpload(postId, mediaId)
      expect(store.getState()).toBe(pending)
      attempts[1].report({state: 'uploading', progress: 0.5})
      const uploading = store.getState()
      store.actions.retryMediaUpload(postId, mediaId)
      expect(store.getState()).toBe(uploading)
      expect(attempts[1].cancel).not.toHaveBeenCalled()

      attempts[1].report({
        state: 'failed',
        code: 'network',
        retryable: true,
      })
      store.actions.retryMediaUpload(postId, mediaId)
      expect(attempts).toHaveLength(3)
      attempts[2].report({state: 'uploaded', blob: {} as never})
      const uploaded = store.getState()
      store.actions.retryMediaUpload(postId, mediaId)
      expect(store.getState()).toBe(uploaded)
      expect(attempts).toHaveLength(3)
      store.destroy()
    },
  )

  test('resets a failed image upload back to pending and walks it to uploaded', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [imageId],
    } = store.actions.addMedia(root, [imageInput])!
    store.internalActions.applyUploadFailure({
      postId: root,
      mediaId: imageId,
      status: {
        state: 'failed',
        code: 'network',
        retryable: true,
      },
      diagnostic: {kind: 'operational', cause: undefined},
    })

    const get = () => {
      const m = getMedia(store, root).find(x => x.id === imageId)!
      if (m.kind !== 'image') throw new Error('expected image')
      return m.upload
    }
    expect(get().state).toBe('failed')

    store.actions.retryMediaUpload(root, imageId)
    expect(get().state).toBe('pending')
    expect(manual.attempts).toHaveLength(2)
    manual.attempts[1].report({state: 'uploaded', blob: {} as never})
    expect(get().state).toBe('uploaded')
  })

  test('is a no-op for a gif media id', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [gifId],
    } = store.actions.addMedia(root, [gifInput])!
    const before = store.getState()
    store.actions.retryMediaUpload(root, gifId)
    expect(store.getState()).toBe(before)
  })

  test('is a no-op when post or media id is unknown', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput])
    const before = store.getState()
    store.actions.retryMediaUpload(root, 'does-not-exist')
    expect(store.getState()).toBe(before)
    store.actions.retryMediaUpload('nope', 'whatever')
    expect(store.getState()).toBe(before)
  })
})

describe('retryAllFailedUploads', () => {
  test('retries eligible failures across posts in stable order', () => {
    const store = makeStore()
    const root = rootId(store)
    const second = store.actions.addPost('after', root)!.addedPostId
    const {
      addedMediaIds: [imageId],
    } = store.actions.addMedia(root, [imageInput])!
    const {
      addedMediaIds: [videoId],
    } = store.actions.addMedia(second, [videoInput])!
    store.internalActions.applyUploadFailure({
      postId: root,
      mediaId: imageId,
      status: {
        state: 'failed',
        code: 'network',
        retryable: true,
      },
      diagnostic: {kind: 'operational', cause: undefined},
    })
    store.internalActions.applyUploadFailure({
      postId: second,
      mediaId: videoId,
      status: {
        state: 'failed',
        code: 'network',
        retryable: true,
      },
      diagnostic: {kind: 'operational', cause: undefined},
    })

    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: [imageId, videoId],
    })
    expect(getUploadState(store, root)).toBe('pending')
    expect(getUploadState(store, second)).toBe('pending')
    expect(manual.attempts.slice(2).map(attempt => attempt.mediaId)).toEqual([
      imageId,
      videoId,
    ])
  })

  test('skips terminal, active, successful, GIF, card, and unresolved items', async () => {
    const store = makeStore()
    const root = rootId(store)
    const second = store.actions.addPost('after', root)!.addedPostId
    const third = store.actions.addPost('after', second)!.addedPostId
    const successfulPost = store.actions.addPost('after', third)!.addedPostId
    const {
      addedMediaIds: [eligibleId],
    } = store.actions.addMedia(root, [imageInput])!
    const {
      addedMediaIds: [terminalId],
    } = store.actions.addMedia(second, [imageInput])!
    const {
      addedMediaIds: [activeId],
    } = store.actions.addMedia(third, [videoInput])!
    store.internalActions.applyUploadFailure({
      postId: root,
      mediaId: eligibleId,
      status: {
        state: 'failed',
        code: 'network',
        retryable: true,
      },
      diagnostic: {kind: 'operational', cause: undefined},
    })
    store.internalActions.applyUploadFailure({
      postId: second,
      mediaId: terminalId,
      status: {
        state: 'failed',
        code: 'video-rejected',
        retryable: false,
      },
      diagnostic: {kind: 'validation', cause: undefined},
    })
    store.internalActions.applyUploadStatus({
      postId: third,
      mediaId: activeId,
      status: {
        state: 'uploading',
      },
    })
    const {
      addedMediaIds: [successfulId],
    } = store.actions.addMedia(successfulPost, [imageInput])!
    store.internalActions.applyUploadStatus({
      postId: successfulPost,
      mediaId: successfulId,
      status: {
        state: 'uploaded',
        blob: {} as never,
      },
    })
    const gifPost = store.actions.addPost('after', successfulPost)!.addedPostId
    store.actions.addMedia(gifPost, [gifInput])
    const cardPost = store.actions.addPost('after', gifPost)!.addedPostId
    store.actions.addUri(cardPost, 'https://example.com/card')
    const unresolvedPost = store.actions.addPost('after', cardPost)!.addedPostId
    mockResolveLink.mockRejectedValueOnce(new Error('bad uri'))
    store.actions.addUri(unresolvedPost, 'https://example.com/unresolved')
    await flush()

    const before = store.getState()
    const result = store.actions.retryAllFailedUploads()

    expect(result).toEqual({retriedMediaIds: [eligibleId]})
    expect(store.getState().posts[second].attachments.media).toBe(
      before.posts[second].attachments.media,
    )
    expect(getUploadState(store, third)).toBe('uploading')
    expect(getUploadState(store, successfulPost)).toBe('uploaded')
    expect(getMedia(store, gifPost)[0].kind).toBe('gif')
    expect(store.getState().posts[cardPost].attachments.media?.state).toBe(
      'pending',
    )
    expect(
      store.getState().posts[unresolvedPost].attachments.media?.state,
    ).toBe('failed')
    await Promise.resolve()
  })

  test('does not restart work on a repeated call', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [mediaId],
    } = store.actions.addMedia(root, [imageInput])!
    store.internalActions.applyUploadFailure({
      postId: root,
      mediaId,
      status: {
        state: 'failed',
        code: 'network',
        retryable: true,
      },
      diagnostic: {kind: 'operational', cause: undefined},
    })

    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: [mediaId],
    })
    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: [],
    })
    expect(manual.attempts).toHaveLength(2)
  })

  test('does not retry a candidate changed by a synchronous subscriber', () => {
    for (const change of ['active', 'remove', 'supersede'] as const) {
      const store = makeStore()
      const root = rootId(store)
      const second = store.actions.addPost('after', root)!.addedPostId
      const {
        addedMediaIds: [firstId],
      } = store.actions.addMedia(root, [imageInput])!
      const {
        addedMediaIds: [secondId],
      } = store.actions.addMedia(second, [imageInput])!
      store.internalActions.applyUploadFailure({
        postId: root,
        mediaId: firstId,
        status: {
          state: 'failed',
          code: 'network',
          retryable: true,
        },
        diagnostic: {kind: 'operational', cause: undefined},
      })
      store.internalActions.applyUploadFailure({
        postId: second,
        mediaId: secondId,
        status: {
          state: 'failed',
          code: 'network',
          retryable: true,
        },
        diagnostic: {kind: 'operational', cause: undefined},
      })

      let handled = false
      store.subscribe(() => {
        if (handled || getMedia(store, root)[0]?.id !== firstId) return
        const first = getMedia(store, root)[0]
        if (first.kind === 'image' && first.upload.state !== 'failed') {
          handled = true
          if (change === 'active') {
            store.internalActions.applyUploadStatus({
              postId: second,
              mediaId: secondId,
              status: {
                state: 'uploading',
              },
            })
          } else {
            store.actions.removeMediaAttachment(second)
            if (change === 'supersede') {
              store.actions.addUri(second, 'https://example.com/replacement')
            }
          }
        }
      })

      expect(store.actions.retryAllFailedUploads()).toEqual({
        retriedMediaIds: [firstId],
      })
      if (change === 'active') {
        expect(getUploadState(store, second)).toBe('uploading')
      } else {
        expect(getMedia(store, second)).toEqual([])
        if (change === 'supersede') {
          expect(store.getState().posts[second].attachments.media?.state).toBe(
            'pending',
          )
        }
      }
      store.destroy()
    }
  })

  test('stops without more work when a subscriber destroys the store', () => {
    const store = makeStore()
    const root = rootId(store)
    const second = store.actions.addPost('after', root)!.addedPostId
    const {
      addedMediaIds: [firstId],
    } = store.actions.addMedia(root, [imageInput])!
    const {
      addedMediaIds: [secondId],
    } = store.actions.addMedia(second, [imageInput])!
    store.internalActions.applyUploadFailure({
      postId: root,
      mediaId: firstId,
      status: {
        state: 'failed',
        code: 'network',
        retryable: true,
      },
      diagnostic: {kind: 'operational', cause: undefined},
    })
    store.internalActions.applyUploadFailure({
      postId: second,
      mediaId: secondId,
      status: {
        state: 'failed',
        code: 'network',
        retryable: true,
      },
      diagnostic: {kind: 'operational', cause: undefined},
    })
    store.subscribe(() => store.destroy())

    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: [firstId],
    })
    expect(
      manual.attempts.filter(attempt => attempt.mediaId === secondId),
    ).toHaveLength(1)
    expect(manual.uncancelled()).toHaveLength(0)
  })

  test('does not repeat an immediate failure in one invocation', () => {
    const starts: string[] = []
    const workers: UploadWorkerOverrides = {
      startImageUpload: opts => {
        starts.push(opts.media.id)
        opts.attempt.reportFailure({
          status: {
            state: 'failed',
            code: 'network',
            retryable: true,
          },
          diagnostic: {kind: 'operational', cause: undefined},
        })
        return {cancel() {}}
      },
    }
    const store = createThreadStore({
      defaultLanguages: [],
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __uploadWorkers: workers,
    })
    const root = rootId(store)
    const {
      addedMediaIds: [mediaId],
    } = store.actions.addMedia(root, [imageInput])!

    expect(starts).toEqual([mediaId])
    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: [mediaId],
    })
    expect(starts).toEqual([mediaId, mediaId])
    expect(getUploadState(store, root)).toBe('failed')
  })

  test('empty and destroyed stores are silent no-ops', () => {
    const store = makeStore()
    const before = store.getState()
    const listener = jest.fn()
    store.subscribe(listener)

    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: [],
    })
    expect(store.getState()).toBe(before)
    expect(listener).not.toHaveBeenCalled()

    store.destroy()
    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: [],
    })
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('updateMediaAltText', () => {
  test('updates only the matching media (image)', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [a, b],
    } = store.actions.addMedia(root, [imageInput, imageInput])!
    store.actions.updateMediaAltText(root, b, 'a description')

    const media = getMedia(store, root)
    expect(media.find(m => m.id === a)?.altText).toBe('')
    expect(media.find(m => m.id === b)?.altText).toBe('a description')
  })

  test('works on a gif as well', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [gifId],
    } = store.actions.addMedia(root, [gifInput])!
    store.actions.updateMediaAltText(root, gifId, 'animated joy')
    expect(getMedia(store, root)[0].altText).toBe('animated joy')
  })

  test('is a no-op when alt text is unchanged', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [imageId],
    } = store.actions.addMedia(root, [imageInput])!
    const before = store.getState()
    store.actions.updateMediaAltText(root, imageId, '')
    expect(store.getState()).toBe(before)
  })
})

describe('removePost cancels media uploads', () => {
  test('removing a post cancels any in-flight uploads on that post', () => {
    const store = makeStore()
    const a = rootId(store)
    const b = store.actions.addPost('after', a)!.addedPostId
    store.actions.addMedia(b, [imageInput])
    const [attempt] = manual.attempts

    store.actions.removePost(b)
    expect(attempt.cancel).toHaveBeenCalled()
    expect(Object.keys(store.getState().posts)).toEqual([a])
  })
})

describe('attachment lifecycle', () => {
  test.each(['edit', 'remove', 'retry', 'destroy'])(
    'subscriber can %s newly added media before its worker starts',
    action => {
      const store = makeStore()
      const root = rootId(store)
      let handled = false
      store.subscribe(() => {
        if (handled) return
        handled = true
        const item = getMedia(store, root)[0]
        if (action === 'edit')
          store.actions.updateMediaAltText(root, item.id, 'alt')
        else if (action === 'remove') store.actions.removeMedia(root, item.id)
        else if (action === 'retry')
          store.actions.retryMediaUpload(root, item.id)
        else store.destroy()
      })
      store.actions.addMedia(root, [imageInput])
      expect(manual.uncancelled()).toHaveLength(
        action === 'edit' || action === 'retry' ? 1 : 0,
      )
      if (action === 'edit' || action === 'retry') {
        manual.uncancelled()[0].report({state: 'uploaded', blob: {} as never})
        const item = getMedia(store, root)[0]
        expect(item.kind !== 'gif' && item.upload.state).toBe('uploaded')
        if (action === 'edit') expect(item.altText).toBe('alt')
      }
    },
  )

  test.each(['remove', 'destroy'])(
    'subscriber can %s media while its worker is still starting',
    action => {
      const cancel = jest.fn()
      let report: ((status: UploadStatus) => void) | undefined
      const store = createThreadStore({
        defaultLanguages: [],
        ...testUploadRuntime,
        resolvers,
        __createId: makeIdGenerator(),
        __resolveLink: mockResolveLink,
        __uploadWorkers: {
          startImageUpload: ({attempt}) => {
            report = status => reportAnyStatus({attempt, status})
            /* Like the real worker, report a phase before returning. */
            report({state: 'uploading', phase: 'compressing'})
            return {cancel}
          },
        },
      })
      const root = rootId(store)
      store.subscribe(() => {
        if (getUploadState(store, root) !== 'uploading') return
        if (action === 'remove') store.actions.removeMediaAttachment(root)
        else store.destroy()
      })
      store.actions.addMedia(root, [imageInput])

      /* Requested before the handle existed, forwarded once it returned. */
      expect(cancel).toHaveBeenCalledTimes(1)
      const after = store.getState()
      if (action === 'remove') expect(getMedia(store, root)).toEqual([])
      report!({state: 'uploaded', blob: {} as never})
      expect(store.getState()).toBe(after)
    },
  )

  test('a real image worker cancelled while starting never uploads', async () => {
    let finishCompression: ((image: PickerImage) => void) | undefined
    const compressImage = jest.fn(
      () =>
        new Promise<PickerImage>(resolve => {
          finishCompression = resolve
        }),
    )
    const uploadBlob = jest.fn<ImageUploadDependencies['uploadBlob']>()
    const store = createThreadStore({
      defaultLanguages: [],
      ...testUploadRuntime,
      resolvers,
      __createId: makeIdGenerator(),
      __resolveLink: mockResolveLink,
      __uploadWorkers: realUploadWorkers({image: {compressImage, uploadBlob}}),
    })
    const root = rootId(store)
    store.subscribe(() => {
      if (getUploadState(store, root) === 'uploading')
        store.actions.removeMediaAttachment(root)
    })
    store.actions.addMedia(root, [imageInput])
    expect(getMedia(store, root)).toEqual([])

    /*
     * Source preparation settles before compression, so the abort is seen
     * first and compression never starts. If it had, it would still run to
     * completion (it has no abort hook) without starting an upload.
     */
    await flush()
    expect(compressImage).not.toHaveBeenCalled()
    finishCompression?.({
      path: 'file:///compressed.jpg',
      width: 1,
      height: 1,
      mime: 'image/jpeg',
      size: 1,
    })
    await flush()
    expect(uploadBlob).not.toHaveBeenCalled()
  })

  test('removing the media attachment cancels all uploads and restores capacity', () => {
    const store = makeStore()
    const root = rootId(store)
    store.actions.addMedia(root, [imageInput, imageInput])
    store.actions.removeMediaAttachment(root)
    const after = store.getState()
    expect(after.posts[root].attachments.media).toBeUndefined()
    expect(after.posts[root].imageSelectionsRemaining).toBe(10)
    expect(manual.attempts).toHaveLength(2)
    expect(manual.uncancelled()).toHaveLength(0)
    for (const attempt of manual.attempts) {
      attempt.report({state: 'uploaded', blob: {} as never})
    }
    expect(store.getState()).toBe(after)
  })

  test('destroy cancels tasks and prevents later actions from starting work', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [mediaId],
    } = store.actions.addMedia(root, [imageInput])!
    store.destroy()
    const after = store.getState()
    expect(store.actions.addMedia(root, [imageInput])).toBeUndefined()
    store.actions.retryMediaUpload(root, mediaId)
    store.actions.addUri(root, 'https://example.com')
    expect(manual.attempts).toHaveLength(1)
    expect(manual.attempts[0].cancel).toHaveBeenCalled()
    expect(mockResolveLink).not.toHaveBeenCalled()
    expect(store.getState()).toBe(after)
  })

  test('failed reports stop the old worker before retrying', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [mediaId],
    } = store.actions.addMedia(root, [imageInput])!
    const [first] = manual.attempts
    first.report({state: 'failed', code: 'network', retryable: true})
    expect(first.cancel).toHaveBeenCalled()
    store.actions.retryMediaUpload(root, mediaId)
    expect(manual.attempts).toHaveLength(2)
    manual.attempts[1].report({state: 'uploaded', blob: {} as never})
    const item = getMedia(store, root)[0]
    expect(item.kind !== 'gif' && item.upload.state).toBe('uploaded')
  })

  test('removing the final item frees the slot for an external card', () => {
    const store = makeStore()
    const root = rootId(store)
    const {
      addedMediaIds: [mediaId],
    } = store.actions.addMedia(root, [videoInput])!
    store.actions.removeMedia(root, mediaId)
    expect(store.getState().posts[root].attachments.media).toBeUndefined()
    store.actions.addUri(root, 'https://example.com')
    expect(store.getState().posts[root].attachments.media?.state).toBe(
      'pending',
    )
    expect(store.actions.addMedia(root, [imageInput])).toEqual({
      addedMediaIds: [],
    })
  })
})
