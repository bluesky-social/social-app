import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {i18n} from '@lingui/core'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

jest.mock('#/lib/media/video/upload', () => ({
  uploadVideo: jest.fn(),
}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {AbortError} from '#/lib/async/cancelable'
import {uploadVideo} from '#/lib/media/video/upload'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  fakeAnalytics,
  testUploadRuntime,
} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {type ThreadStoreInitialState} from '#/components/ComposerV2/store/types'
import {abortableSleep} from '#/components/ComposerV2/store/uploadDependencies'
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
function captureWorkerOptions({
  analytics = testUploadRuntime.analytics,
}: {analytics?: typeof testUploadRuntime.analytics} = {}) {
  let image: ImageUploadDependencies | undefined
  let video:
    | (VideoUploadDependencies & {metric: (typeof analytics)['metric']})
    | undefined
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
    defaultLanguages: [],
    ...testUploadRuntime,
    analytics,
    resolvers,
    initialState,
    __uploadWorkers: workers,
  })
  store.destroy()
  if (!image || !video) throw new Error('expected both workers to start')
  return {image, video}
}

describe('upload worker dependency wiring', () => {
  test('production uploadVideo binds the global i18n for the shared helper', async () => {
    const {video} = captureWorkerOptions()
    const args = {
      video: {} as never,
      client: {} as never,
      dispatchUrl: 'https://pds.example.test',
      setProgress: () => {},
      signal: new AbortController().signal,
    }

    await video.uploadVideo(args)

    expect(uploadVideo).toHaveBeenCalledWith({...args, i18n})
  })

  test('every store shares one image compression limiter', () => {
    const first = captureWorkerOptions().image
    const second = captureWorkerOptions().image

    expect(first.limitImageCompression).toBe(second.limitImageCompression)
  })

  test("video workers report to the session's analytics", () => {
    const {metric, analytics} = fakeAnalytics()
    const {video} = captureWorkerOptions({analytics})

    expect(video.metric).toBe(metric)
  })

  test('loading the store does not load the #/state/gallery UI chain', () => {
    jest.isolateModules(() => {
      jest.doMock('#/state/gallery', () => {
        throw new Error('Composer store loaded #/state/gallery')
      })
      expect(() => require('#/components/ComposerV2/store')).not.toThrow()
    })
  })
})

describe('abortableSleep', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  test('detaches its abort listener when it resolves', async () => {
    jest.useFakeTimers()
    const {signal} = new AbortController()
    const add = jest.spyOn(signal, 'addEventListener')
    const remove = jest.spyOn(signal, 'removeEventListener')

    const sleep = abortableSleep({ms: 1000, signal})
    jest.advanceTimersByTime(1000)
    await sleep

    const [[, listener]] = add.mock.calls
    expect(remove).toHaveBeenCalledWith('abort', listener)
  })

  test('an abort rejects with AbortError and clears the timer', async () => {
    jest.useFakeTimers()
    const controller = new AbortController()

    const sleep = abortableSleep({ms: 1000, signal: controller.signal})
    controller.abort()

    await expect(sleep).rejects.toBeInstanceOf(AbortError)
    expect(jest.getTimerCount()).toBe(0)
  })
})
