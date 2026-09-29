import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {uploadBlob} from '#/lib/api/upload-blob'
import {compressImage} from '#/lib/media/image/compress'
import {compressVideo} from '#/lib/media/video/compress'
import {uploadVideo} from '#/lib/media/video/upload'
import {createTokenlessVideoServiceClient} from '#/lib/media/video/util'
import {getVideoMetadata} from '#/view/com/composer/videos/metadata'
import {createThreadStore} from '#/components/ComposerV2/store'
import {testUploadRuntime} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {type ThreadStoreInitialState} from '#/components/ComposerV2/store/types'
import {
  type ImageUploadDependencies,
  type UploadWorkerOverrides,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'

const resolvers = {} as LinkResolvers

const initialState: ThreadStoreInitialState = {
  posts: [
    {
      attachments: {
        media: {
          kind: 'images',
          items: [{uri: 'file:///a.jpg', width: 1, height: 1}],
        },
      },
    },
    {
      attachments: {
        media: {
          kind: 'video',
          item: {
            uri: 'file:///a.mp4',
            width: 1,
            height: 1,
            mimeType: 'video/mp4',
          },
        },
      },
    },
  ],
}

/** Capture what the store hands each worker without running any upload. */
function captureWorkerOptions() {
  let image: ImageUploadDependencies | undefined
  let video: VideoUploadDependencies | undefined
  const workers: UploadWorkerOverrides = {
    startImageUpload: opts => {
      image = opts
      return {cancel() {}}
    },
    startVideoUpload: opts => {
      video = opts
      return {cancel() {}}
    },
  }
  const store = createThreadStore({
    ...testUploadRuntime,
    resolvers,
    initialState,
    __uploadWorkers: workers,
  })
  store.destroy()
  if (!image || !video) throw new Error('expected both workers to start')
  return {image, video}
}

describe('upload worker dependency wiring', () => {
  test('store callers get the production implementations', () => {
    const {image, video} = captureWorkerOptions()

    expect(image).toMatchObject({compressImage, uploadBlob})
    expect(video).toMatchObject({
      getVideoMetadata,
      compressVideo,
      uploadVideo,
      uploadBlob,
      createVideoServiceClient: createTokenlessVideoServiceClient,
    })
    expect(video.sleep).toEqual(expect.any(Function))
  })

  test('image workers are not handed video-only dependencies', () => {
    const {image} = captureWorkerOptions()

    expect(image).not.toHaveProperty('uploadVideo')
    expect(image).not.toHaveProperty('compressVideo')
  })

  test('loading the store does not load the #/state/gallery UI chain', () => {
    jest.isolateModules(() => {
      jest.doMock('#/state/gallery', () => {
        throw new Error('ComposerV2 store loaded #/state/gallery')
      })
      expect(() => require('#/components/ComposerV2/store')).not.toThrow()
    })
  })
})
