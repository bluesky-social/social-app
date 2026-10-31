import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({resolveLink: jest.fn()}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type ImageUploadDependencies,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'
import {flush, realUploadWorkers, testUploadRuntime} from './uploadTestUtils'

/*
 * A source whose dimension read rejects can never upload, so it fails as
 * non-retryable `unreadable-media`. Compression failures stay retryable.
 */

const resolvers = {} as LinkResolvers

/** The web image loader rejects with a DOM `Event`, never an `Error`. */
const rejections: [string, () => unknown][] = [
  ['a non-Error value', () => ({type: 'error'})],
  ['an Error', () => new Error('Failed to load image')],
]

/** Media with no known dimensions, so the worker has to read them. */
const sources = [
  {
    name: 'image',
    media: {kind: 'image', uri: 'file:///broken.jpg', mimeType: 'image/jpeg'},
  },
  {
    name: 'GIF',
    media: {kind: 'video', uri: 'file:///broken.gif', mimeType: 'image/gif'},
  },
] as const

function setup({
  getImageDimensions,
  compressImageError,
}: {
  getImageDimensions: ImageUploadDependencies['getImageDimensions']
  compressImageError?: Error
}) {
  const compressImage = jest.fn<ImageUploadDependencies['compressImage']>(() =>
    compressImageError
      ? Promise.reject(compressImageError)
      : new Promise(() => {}),
  )
  const compressVideo = jest.fn()
  const uploadBlob = jest.fn()
  const uploadVideo = jest.fn()
  const store = createThreadStore({
    defaultLanguages: [],
    ...testUploadRuntime,
    resolvers,
    __uploadWorkers: realUploadWorkers({
      image: {
        getImageDimensions,
        compressImage,
        uploadBlob: uploadBlob as ImageUploadDependencies['uploadBlob'],
      },
      video: {
        getImageDimensions,
        compressVideo:
          compressVideo as VideoUploadDependencies['compressVideo'],
        uploadVideo: uploadVideo as VideoUploadDependencies['uploadVideo'],
        uploadBlob: uploadBlob as VideoUploadDependencies['uploadBlob'],
        getFileSize: () => Promise.resolve(1000),
      },
    }),
  })
  const postId = Object.keys(store.getState().posts)[0]
  const upload = () => {
    const [item] = getMediaItems({
      media: store.getState().posts[postId].attachments.media,
    })
    if (!item || item.kind === 'gif') throw new Error('expected an upload')
    return item.upload
  }
  return {
    store,
    postId,
    upload,
    compressImage,
    compressVideo,
    uploadBlob,
    uploadVideo,
  }
}

describe('unreadable media', () => {
  describe.each(sources)('$name', ({media}) => {
    test.each(rejections)(
      'a dimension read rejecting with %s is a permanent failure',
      async (_case, rejection) => {
        const {
          store,
          postId,
          upload,
          compressImage,
          compressVideo,
          uploadBlob,
          uploadVideo,
        } = setup({
          getImageDimensions: jest
            .fn<ImageUploadDependencies['getImageDimensions']>()
            .mockRejectedValue(rejection()),
        })
        store.actions.addMedia(postId, [media])
        await flush()

        expect(upload()).toEqual({
          state: 'failed',
          code: 'unreadable-media',
          retryable: false,
        })
        for (const fake of [
          compressImage,
          compressVideo,
          uploadBlob,
          uploadVideo,
        ]) {
          expect(fake).not.toHaveBeenCalled()
        }
        expect(store.actions.retryAllFailedUploads()).toEqual({
          retriedMediaIds: [],
        })
        store.destroy()
      },
    )
  })

  test('a compression failure stays retryable', async () => {
    const {store, postId, upload} = setup({
      getImageDimensions: () => Promise.resolve({width: 10, height: 10}),
      compressImageError: new Error('out of memory'),
    })
    const {addedMediaIds} = store.actions.addMedia(postId, [sources[0].media])!
    await flush()

    expect(upload()).toMatchObject({state: 'failed', retryable: true})
    expect(store.actions.retryAllFailedUploads()).toEqual({
      retriedMediaIds: addedMediaIds,
    })
    store.destroy()
  })
})
