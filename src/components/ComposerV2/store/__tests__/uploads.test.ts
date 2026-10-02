import {type BlobRef, type Client} from '@atproto/lex'
import {afterEach, describe, expect, jest, test} from '@jest/globals'

let mockIsWeb = false
jest.mock('#/env', () =>
  /* A getter keeps IS_WEB live; object spread would copy its current value. */
  Object.defineProperty({...jest.requireActual<object>('#/env')}, 'IS_WEB', {
    get: () => mockIsWeb,
  }),
)

import {VIDEO_MAX_SIZE} from '#/lib/constants'
import {VideoTooLargeError} from '#/lib/media/video/errors'
import {type CompressedVideo} from '#/lib/media/video/types'
import {
  fakeImageDependencies,
  fakeVideoDependencies,
} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {
  type PostMediaImage,
  type PostMediaVideo,
  type UploadStatus,
} from '#/components/ComposerV2/store/types'
import {
  startImageUpload,
  startVideoUpload,
  type VideoUploadDependencies,
} from '#/components/ComposerV2/store/uploads'

const blob = (name: string) =>
  ({
    $type: 'blob',
    ref: {$link: name},
    mimeType: 'image/jpeg',
    size: 1,
  }) as unknown as BlobRef

const i18n = {_: (message: unknown) => String(message)} as never

async function settle() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

function image(overrides: Partial<PostMediaImage> = {}): PostMediaImage {
  return {
    kind: 'image',
    id: 'image-1',
    postId: 'post-1',
    uri: 'file:///source.jpg',
    width: 1200,
    height: 800,
    altText: 'alt survives',
    localRefPath: 'image:one',
    upload: {state: 'pending'},
    ...overrides,
  }
}

function video(overrides: Partial<PostMediaVideo> = {}): PostMediaVideo {
  return {
    kind: 'video',
    id: 'video-1',
    postId: 'post-1',
    uri: 'file:///source.mp4',
    width: 1920,
    height: 1080,
    mimeType: 'video/mp4',
    altText: 'video alt',
    localRefPath: 'video:one',
    captions: [{lang: 'en', content: 'WEBVTT\n'}],
    captionBlobs: [],
    upload: {state: 'pending'},
    ...overrides,
  }
}

/** Complete native source metadata, so preparation reads nothing. */
const completeSource = {duration: 1000, fileSize: 1000}

/** A real File whose reported size can exceed what a test should allocate. */
function webFile({
  type,
  size = 1000,
  name = 'source',
}: {
  type: string
  size?: number
  name?: string
}) {
  const file = new File(['bytes'], name, {type})
  Object.defineProperty(file, 'size', {value: size})
  return file
}

const pdsClient = {} as Client
const runtime = {
  pdsClient,
  pdsUrl: 'https://pds.example',
  i18n,
  metric: jest.fn(),
}

afterEach(() => {
  mockIsWeb = false
})

/**
 * Runs the real video worker with captions omitted. Unlisted dependencies are
 * strict fakes that fail the upload if reached, so each test states exactly
 * which metadata helpers its source is allowed to use.
 */
async function runVideo({
  media,
  compressed = {
    uri: 'file:///compressed.mp4',
    size: 100,
    mimeType: 'video/mp4',
  },
  compressError,
  dependencies = {},
}: {
  media: Partial<PostMediaVideo>
  compressed?: CompressedVideo
  compressError?: Error
  dependencies?: Partial<VideoUploadDependencies>
}) {
  const statuses: UploadStatus[] = []
  const prepared = jest.fn()
  const sourceMetadata = jest.fn()
  const compressVideo = jest.fn<VideoUploadDependencies['compressVideo']>(() =>
    compressError ? Promise.reject(compressError) : Promise.resolve(compressed),
  )
  const uploadVideo = jest.fn(() =>
    Promise.resolve({
      state: 'JOB_STATE_COMPLETED',
      jobId: 'job-1',
      blob: blob('video'),
    }),
  )
  startVideoUpload({
    postId: 'post-1',
    mediaId: 'video-1',
    media: video({captions: [], ...media}),
    ...runtime,
    ...fakeVideoDependencies({
      compressVideo,
      uploadVideo: uploadVideo as never,
      ...dependencies,
    }),
    setMediaCompressionResult: prepared,
    setMediaSourceMetadata: sourceMetadata,
    setUploadStatus: (_post, _media, status) => statuses.push(status),
  })
  await settle()
  return {statuses, prepared, sourceMetadata, compressVideo, uploadVideo}
}

/** The asset the compressor received. */
function compressedAsset(
  compressVideo: jest.Mock<VideoUploadDependencies['compressVideo']>,
) {
  expect(compressVideo).toHaveBeenCalledTimes(1)
  return compressVideo.mock.calls[0][0]
}

describe('ComposerV2 real media workers', () => {
  test('compresses an image before uploading the transformed output', async () => {
    const statuses: UploadStatus[] = []
    const prepared = jest.fn()
    const compressImage = jest.fn(() =>
      Promise.resolve({
        path: 'file:///compressed.jpg',
        width: 400,
        height: 300,
        mime: 'image/jpeg',
        size: 123,
      }),
    )
    const uploadBlob = jest.fn(() => Promise.resolve({blob: blob('image')}))

    startImageUpload({
      postId: 'post-1',
      mediaId: 'image-1',
      media: image(),
      ...runtime,
      ...fakeImageDependencies({compressImage, uploadBlob}),
      setMediaCompressionResult: prepared,
      setUploadStatus: (_post, _media, status) => statuses.push(status),
    })
    await settle()

    expect(compressImage).toHaveBeenCalledWith({
      image: expect.objectContaining({
        source: expect.objectContaining({
          path: 'file:///source.jpg',
          width: 1200,
          height: 800,
        }),
      }),
      maxDimension: 4000,
      maxSize: 2000000,
    })
    expect(uploadBlob).toHaveBeenCalledWith(
      expect.anything(),
      'file:///compressed.jpg',
      'image/jpeg',
    )
    expect(prepared).toHaveBeenCalledWith('post-1', 'image-1', {
      kind: 'image',
      uri: 'file:///compressed.jpg',
      width: 400,
      height: 300,
      mimeType: 'image/jpeg',
      aspectRatio: {width: 400, height: 300},
      size: 123,
    })
    expect(statuses.at(-1)).toEqual({state: 'uploaded', blob: blob('image')})
  })

  test('does not begin image upload after cancellation during uncancellable compression', async () => {
    let resolveCompression!: (value: {
      path: string
      width: number
      height: number
      mime: string
    }) => void
    const compressImage = jest.fn(
      () => new Promise(resolve => (resolveCompression = resolve)),
    )
    const uploadBlob = jest.fn()
    const statuses: UploadStatus[] = []
    const task = startImageUpload({
      postId: 'post-1',
      mediaId: 'image-1',
      media: image(),
      ...runtime,
      ...fakeImageDependencies({
        compressImage: compressImage as never,
        uploadBlob: uploadBlob as never,
      }),
      setUploadStatus: (_post, _media, status) => statuses.push(status),
    })
    await settle()
    expect(compressImage).toHaveBeenCalledTimes(1)
    task.cancel()
    resolveCompression({
      path: 'file:///compressed.jpg',
      width: 1,
      height: 1,
      mime: 'image/jpeg',
    })
    await settle()

    expect(uploadBlob).not.toHaveBeenCalled()
    expect(statuses).toEqual([{state: 'uploading', phase: 'compressing'}])
  })

  test('rejects invalid video metadata as terminal without compressing', async () => {
    const compressVideo = jest.fn()
    const statuses: UploadStatus[] = []
    startVideoUpload({
      postId: 'post-1',
      mediaId: 'video-1',
      media: video(),
      ...runtime,
      ...fakeVideoDependencies({
        getVideoMetadata: () =>
          Promise.resolve({
            uri: 'file:///source.mp4',
            mimeType: 'video/mp4',
            width: 1920,
            height: 1080,
            duration: 10 * 60 * 1000 + 1,
          }),
        compressVideo: compressVideo as never,
      }),
      setUploadStatus: (_post, _media, status) => statuses.push(status),
    })
    await settle()

    expect(compressVideo).not.toHaveBeenCalled()
    expect(statuses.at(-1)).toMatchObject({
      state: 'failed',
      code: 'video-too-long',
      retryable: false,
    })
  })

  describe('video source versus upload-output validation', () => {
    test('native: compresses a source above the upload limit and uploads the smaller output', async () => {
      const {statuses, prepared, compressVideo, uploadVideo} = await runVideo({
        media: {...completeSource, fileSize: VIDEO_MAX_SIZE * 2},
        compressed: {
          uri: 'file:///compressed.mp4',
          size: VIDEO_MAX_SIZE - 1,
          mimeType: 'video/mp4',
        },
      })

      expect(compressedAsset(compressVideo)).toMatchObject({
        uri: 'file:///source.mp4',
        fileSize: VIDEO_MAX_SIZE * 2,
      })
      expect(prepared).toHaveBeenCalledWith(
        'post-1',
        'video-1',
        expect.objectContaining({size: VIDEO_MAX_SIZE - 1}),
      )
      expect(uploadVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({uri: 'file:///compressed.mp4'}),
        }),
      )
      expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
    })

    test('native: transcodes a source format outside the upload allowlist', async () => {
      const {statuses, compressVideo, uploadVideo} = await runVideo({
        media: {
          ...completeSource,
          uri: 'file:///source.mkv',
          mimeType: 'video/x-matroska',
        },
      })

      expect(compressedAsset(compressVideo)).toMatchObject({
        mimeType: 'video/x-matroska',
      })
      expect(uploadVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({mimeType: 'video/mp4'}),
        }),
      )
      expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
    })

    test.each([
      ['native', false],
      ['web', true],
    ])(
      '%s: never uploads compressed output above the upload limit',
      async (_platform, isWeb) => {
        mockIsWeb = isWeb
        const {statuses, prepared, compressVideo, uploadVideo} = await runVideo(
          {
            media: {
              ...completeSource,
              fileSize: VIDEO_MAX_SIZE * 2,
              file: isWeb ? webFile({type: 'video/mp4'}) : undefined,
            },
            compressed: {
              uri: 'file:///compressed.mp4',
              size: VIDEO_MAX_SIZE + 1,
              mimeType: 'video/mp4',
            },
          },
        )

        expect(compressVideo).toHaveBeenCalled()
        expect(prepared).not.toHaveBeenCalled()
        expect(uploadVideo).not.toHaveBeenCalled()
        expect(statuses.at(-1)).toMatchObject({
          state: 'failed',
          retryable: false,
        })
      },
    )

    test('web: surfaces the compressor pass-through size rejection without uploading', async () => {
      mockIsWeb = true
      const {statuses, compressVideo, uploadVideo} = await runVideo({
        media: {duration: 1000, file: webFile({type: 'video/mp4'})},
        compressError: new VideoTooLargeError(),
      })

      expect(compressVideo).toHaveBeenCalled()
      expect(uploadVideo).not.toHaveBeenCalled()
      expect(statuses.at(-1)).toMatchObject({
        state: 'failed',
        code: undefined,
        retryable: false,
      })
    })

    test.each([
      ['zero width', {width: 0}, 'invalid-video-dimensions'],
      ['negative height', {height: -1}, 'invalid-video-dimensions'],
      ['excessive duration', {duration: 10 * 60 * 1000 + 1}, 'video-too-long'],
    ])(
      'native: rejects probed %s before compressing a transcodable oversized source',
      async (_case, probed, code) => {
        const getVideoMetadata = jest.fn(() =>
          Promise.resolve({
            uri: 'file:///source.mkv',
            mimeType: 'video/x-matroska',
            width: 1920,
            height: 1080,
            duration: 1000,
            fileSize: VIDEO_MAX_SIZE * 2,
            ...probed,
          }),
        )
        const {statuses, compressVideo} = await runVideo({
          media: {
            uri: 'file:///source.mkv',
            mimeType: undefined,
            width: undefined,
            height: undefined,
          },
          dependencies: {getVideoMetadata},
        })

        expect(getVideoMetadata).toHaveBeenCalledWith(
          'file:///source.mkv',
          undefined,
        )
        expect(compressVideo).not.toHaveBeenCalled()
        expect(statuses.at(-1)).toMatchObject({
          state: 'failed',
          code,
          retryable: false,
        })
      },
    )

    test('native: rejects a known excessive duration without probing', async () => {
      const {statuses, compressVideo} = await runVideo({
        media: {...completeSource, duration: 10 * 60 * 1000 + 1},
      })

      expect(compressVideo).not.toHaveBeenCalled()
      expect(statuses.at(-1)).toMatchObject({code: 'video-too-long'})
    })

    test.each([
      {platform: 'native', isWeb: false, mimeType: 'application/pdf'},
      {platform: 'native', isWeb: false, mimeType: 'image/png'},
      {platform: 'web', isWeb: true, mimeType: 'video/x-matroska'},
    ])(
      '$platform: rejects a $mimeType source it cannot upload or transcode',
      async ({isWeb, mimeType}) => {
        mockIsWeb = isWeb
        const {statuses, compressVideo} = await runVideo({
          media: {
            ...completeSource,
            mimeType,
            file: isWeb ? webFile({type: mimeType}) : undefined,
          },
        })

        expect(compressVideo).not.toHaveBeenCalled()
        expect(statuses.at(-1)).toMatchObject({
          state: 'failed',
          code: 'unsupported-video-format',
          retryable: false,
        })
      },
    )

    test('native: rejects a source whose probe cannot determine a type', async () => {
      const {statuses, compressVideo} = await runVideo({
        media: {uri: 'file:///source', mimeType: undefined},
        dependencies: {
          getVideoMetadata: () =>
            Promise.resolve({uri: 'file:///source', width: 1, height: 1}),
        },
      })

      expect(compressVideo).not.toHaveBeenCalled()
      expect(statuses.at(-1)).toMatchObject({
        code: 'unsupported-video-format',
      })
    })

    test.each([
      ['native', false, {fileSize: VIDEO_MAX_SIZE + 1}],
      [
        'web',
        true,
        {file: webFile({type: 'image/gif', size: VIDEO_MAX_SIZE + 1})},
      ],
    ])(
      '%s: rejects an oversized GIF before compression since GIFs pass through',
      async (_platform, isWeb, source) => {
        mockIsWeb = isWeb
        const {statuses, compressVideo} = await runVideo({
          media: {mimeType: 'image/gif', ...source},
        })

        expect(compressVideo).not.toHaveBeenCalled()
        expect(statuses.at(-1)).toMatchObject({
          state: 'failed',
          retryable: false,
        })
      },
    )

    test.each([
      ['native', false],
      ['web', true],
    ])(
      '%s: passes an acceptable GIF through to upload',
      async (_platform, isWeb) => {
        mockIsWeb = isWeb
        const {statuses, compressVideo, uploadVideo} = await runVideo({
          media: {
            mimeType: 'image/gif',
            fileSize: 1000,
            file: isWeb ? webFile({type: 'image/gif'}) : undefined,
          },
          compressed: {
            uri: 'file:///source.gif',
            size: 1000,
            mimeType: 'image/gif',
            passthroughReason: 'gif',
          },
        })

        expect(compressVideo).toHaveBeenCalled()
        expect(uploadVideo).toHaveBeenCalled()
        expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
      },
    )

    test('web: lets a large allowlisted source reach the compressor', async () => {
      mockIsWeb = true
      const {statuses, compressVideo, uploadVideo} = await runVideo({
        media: {
          mimeType: 'video/webm',
          duration: 1000,
          file: webFile({type: 'video/webm', size: VIDEO_MAX_SIZE * 2}),
        },
      })

      expect(compressVideo).toHaveBeenCalled()
      expect(uploadVideo).toHaveBeenCalled()
      expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
    })
  })

  describe('video source preparation', () => {
    test('native: complete picker metadata reaches the compressor without probing', async () => {
      const {sourceMetadata, compressVideo, statuses} = await runVideo({
        media: completeSource,
      })

      expect(compressedAsset(compressVideo)).toEqual({
        uri: 'file:///source.mp4',
        file: undefined,
        mimeType: 'video/mp4',
        width: 1920,
        height: 1080,
        duration: 1000,
        fileSize: 1000,
      })
      /* Nothing new: the store keeps the item unchanged. */
      expect(sourceMetadata).toHaveBeenCalledWith('post-1', 'video-1', {
        width: 1920,
        height: 1080,
        mimeType: 'video/mp4',
        duration: 1000,
        fileSize: 1000,
      })
      expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
    })

    test('native: a missing size uses a file stat, not the probe', async () => {
      const getFileSize = jest.fn(() => Promise.resolve(4321))
      const {sourceMetadata, compressVideo} = await runVideo({
        media: {duration: 1000},
        dependencies: {getFileSize},
      })

      expect(getFileSize).toHaveBeenCalledWith('file:///source.mp4')
      expect(compressedAsset(compressVideo).fileSize).toBe(4321)
      expect(sourceMetadata).toHaveBeenCalledWith(
        'post-1',
        'video-1',
        expect.objectContaining({fileSize: 4321}),
      )
    })

    test('native: a failed size stat for video still compresses, without a size', async () => {
      const {compressVideo, statuses} = await runVideo({
        media: {duration: 1000},
        dependencies: {
          getFileSize: () => Promise.reject(new Error('stat failed')),
        },
      })

      expect(compressedAsset(compressVideo).fileSize).toBeUndefined()
      expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
    })

    test('native: probes a URI only for missing metadata and keeps known values', async () => {
      const getVideoMetadata = jest.fn(() =>
        Promise.resolve({
          uri: 'file:///source.mov',
          mimeType: 'video/quicktime',
          width: 1080,
          height: 1920,
          duration: 2500,
          fileSize: 9000,
        }),
      )
      const {sourceMetadata, compressVideo} = await runVideo({
        media: {
          uri: 'file:///source.mov',
          mimeType: 'video/quicktime',
          width: 640,
          height: 480,
        },
        dependencies: {getVideoMetadata},
      })

      expect(getVideoMetadata).toHaveBeenCalledWith(
        'file:///source.mov',
        'video/quicktime',
      )
      expect(compressedAsset(compressVideo)).toMatchObject({
        width: 640,
        height: 480,
        duration: 2500,
        fileSize: 9000,
      })
      expect(sourceMetadata).toHaveBeenCalledWith(
        'post-1',
        'video-1',
        expect.objectContaining({duration: 2500, fileSize: 9000}),
      )
    })

    test('native: an intent video with only dimensions is probed for its type and duration', async () => {
      const getVideoMetadata = jest.fn(() =>
        Promise.resolve({
          uri: 'file:///shared',
          mimeType: 'video/mp4',
          width: 320,
          height: 240,
          duration: 3000,
          fileSize: 5000,
        }),
      )
      const {sourceMetadata, statuses} = await runVideo({
        media: {uri: 'file:///shared', mimeType: undefined},
        dependencies: {getVideoMetadata},
      })

      expect(getVideoMetadata).toHaveBeenCalledWith('file:///shared', undefined)
      expect(sourceMetadata).toHaveBeenCalledWith(
        'post-1',
        'video-1',
        expect.objectContaining({
          mimeType: 'video/mp4',
          duration: 3000,
          fileSize: 5000,
        }),
      )
      expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
    })

    test.each([
      ['a GIF MIME type', {uri: 'file:///source.mp4', mimeType: 'image/gif'}],
      ['a .gif extension', {uri: 'file:///source.gif', mimeType: undefined}],
    ])(
      'native: a GIF identified by %s never reaches the video probe',
      async (_case, source) => {
        const getImageDimensions = jest.fn(() =>
          Promise.resolve({width: 480, height: 270}),
        )
        const getFileSize = jest.fn(() => Promise.resolve(2048))
        const {sourceMetadata, compressVideo, statuses} = await runVideo({
          media: {width: undefined, height: undefined, ...source},
          compressed: {
            uri: 'file:///source.gif',
            size: 2048,
            mimeType: 'image/gif',
            passthroughReason: 'gif',
          },
          /* getVideoMetadata stays a strict fake: calling it fails the test. */
          dependencies: {getImageDimensions, getFileSize},
        })

        expect(getImageDimensions).toHaveBeenCalledWith(source.uri)
        expect(getFileSize).toHaveBeenCalledWith(source.uri)
        expect(compressedAsset(compressVideo)).toMatchObject({
          mimeType: 'image/gif',
          width: 480,
          height: 270,
          fileSize: 2048,
        })
        expect(sourceMetadata).toHaveBeenCalledWith(
          'post-1',
          'video-1',
          expect.objectContaining({width: 480, height: 270, fileSize: 2048}),
        )
        expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
      },
    )

    test('web: a File source gives the probe a File and supplies type and size itself', async () => {
      mockIsWeb = true
      const file = webFile({type: 'video/webm', size: 7777})
      const getVideoMetadata = jest.fn<
        VideoUploadDependencies['getVideoMetadata']
      >(() =>
        Promise.resolve({
          uri: 'blob:metadata',
          mimeType: 'video/webm',
          width: 1280,
          height: 720,
          duration: 4000,
        }),
      )
      const {sourceMetadata, compressVideo} = await runVideo({
        media: {
          uri: 'blob:source',
          mimeType: undefined,
          width: undefined,
          height: undefined,
          file,
        },
        dependencies: {getVideoMetadata},
      })

      expect(getVideoMetadata).toHaveBeenCalledWith(file, 'video/webm')
      expect(compressedAsset(compressVideo)).toMatchObject({
        uri: 'blob:source',
        file,
        mimeType: 'video/webm',
        width: 1280,
        height: 720,
        duration: 4000,
        fileSize: 7777,
      })
      expect(sourceMetadata).toHaveBeenCalledWith('post-1', 'video-1', {
        width: 1280,
        height: 720,
        mimeType: 'video/webm',
        duration: 4000,
        fileSize: 7777,
      })
    })

    test('web: a URI-only source is fetched once into a File for the probe', async () => {
      mockIsWeb = true
      const fetched = new Blob(['bytes'], {type: 'video/mp4'})
      const fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({blob: () => Promise.resolve(fetched)} as Response)
      const getVideoMetadata = jest.fn<
        VideoUploadDependencies['getVideoMetadata']
      >(() =>
        Promise.resolve({
          uri: 'blob:metadata',
          width: 1,
          height: 1,
          duration: 1000,
        }),
      )
      try {
        const {compressVideo} = await runVideo({
          media: {uri: 'data:video/mp4;base64,AAAA'},
          dependencies: {getVideoMetadata},
        })

        expect(fetchSpy).toHaveBeenCalledTimes(1)
        expect(fetchSpy).toHaveBeenCalledWith('data:video/mp4;base64,AAAA')
        const probedWith = getVideoMetadata.mock.calls[0][0]
        expect(probedWith).toBeInstanceOf(File)
        expect((probedWith as File).type).toBe('video/mp4')
        /* The compressor reuses the fetched File rather than fetching again. */
        expect(compressedAsset(compressVideo).file).toBe(probedWith)
      } finally {
        fetchSpy.mockRestore()
      }
    })

    test('web: a complete URI-only source is neither fetched nor probed', async () => {
      mockIsWeb = true
      const fetchSpy = jest.spyOn(globalThis, 'fetch')
      try {
        const {compressVideo} = await runVideo({
          media: {uri: 'blob:source', duration: 1000},
        })

        expect(fetchSpy).not.toHaveBeenCalled()
        expect(compressedAsset(compressVideo)).toMatchObject({
          uri: 'blob:source',
          file: undefined,
          mimeType: 'video/mp4',
        })
      } finally {
        fetchSpy.mockRestore()
      }
    })

    test('web: GIF dimensions come from the image loader, size from the File', async () => {
      mockIsWeb = true
      const getImageDimensions = jest.fn(() =>
        Promise.resolve({width: 200, height: 100}),
      )
      const {compressVideo} = await runVideo({
        media: {
          uri: 'blob:gif',
          mimeType: undefined,
          width: undefined,
          height: undefined,
          file: webFile({type: 'image/gif', size: 3000}),
        },
        compressed: {
          uri: 'blob:gif',
          size: 3000,
          mimeType: 'image/gif',
          passthroughReason: 'gif',
        },
        dependencies: {getImageDimensions},
      })

      expect(getImageDimensions).toHaveBeenCalledWith('blob:gif')
      expect(compressedAsset(compressVideo)).toMatchObject({
        mimeType: 'image/gif',
        width: 200,
        height: 100,
        fileSize: 3000,
      })
    })

    test('a failed metadata read is a retryable failure that never compresses', async () => {
      const {statuses, sourceMetadata, compressVideo} = await runVideo({
        media: {duration: undefined},
        dependencies: {
          getVideoMetadata: () => Promise.reject(new Error('probe failed')),
        },
      })

      expect(sourceMetadata).not.toHaveBeenCalled()
      expect(compressVideo).not.toHaveBeenCalled()
      expect(statuses.at(-1)).toMatchObject({state: 'failed', retryable: true})
    })
  })

  describe('image source preparation', () => {
    async function runImage({
      media,
      getImageDimensions,
    }: {
      media: Partial<PostMediaImage>
      getImageDimensions?: (
        uri: string,
      ) => Promise<{width: number; height: number}>
    }) {
      const statuses: UploadStatus[] = []
      const sourceMetadata = jest.fn()
      const compressImage = jest.fn(() =>
        Promise.resolve({
          path: 'file:///compressed.jpg',
          width: 400,
          height: 300,
          mime: 'image/jpeg',
          size: 123,
        }),
      )
      const uploadBlob = jest.fn(() => Promise.resolve({blob: blob('image')}))
      startImageUpload({
        postId: 'post-1',
        mediaId: 'image-1',
        media: image(media),
        ...runtime,
        ...fakeImageDependencies({
          compressImage,
          uploadBlob,
          ...(getImageDimensions ? {getImageDimensions} : {}),
        }),
        setMediaSourceMetadata: sourceMetadata,
        setUploadStatus: (_post, _media, status) => statuses.push(status),
      })
      await settle()
      return {statuses, sourceMetadata, compressImage, uploadBlob}
    }

    test.each([
      ['a native pasted file URI', 'file:///tmp/pasted.png', undefined],
      ['a web data URI', 'data:image/png;base64,AAAA', 'image/png'],
      ['a web object URL', 'blob:https://bsky.app/pasted', undefined],
    ])(
      'resolves missing dimensions for %s and hands the source to compression and upload',
      async (_case, uri, mimeType) => {
        const getImageDimensions = jest.fn(() =>
          Promise.resolve({width: 900, height: 600}),
        )
        const {statuses, sourceMetadata, compressImage, uploadBlob} =
          await runImage({
            media: {uri, width: undefined, height: undefined},
            getImageDimensions,
          })

        expect(getImageDimensions).toHaveBeenCalledWith(uri)
        expect(compressImage).toHaveBeenCalledWith(
          expect.objectContaining({
            image: expect.objectContaining({
              source: expect.objectContaining({
                path: uri,
                width: 900,
                height: 600,
              }),
            }),
          }),
        )
        expect(sourceMetadata).toHaveBeenCalledWith('post-1', 'image-1', {
          width: 900,
          height: 600,
          mimeType,
        })
        expect(uploadBlob).toHaveBeenCalledWith(
          pdsClient,
          'file:///compressed.jpg',
          'image/jpeg',
        )
        expect(statuses.at(-1)).toEqual({
          state: 'uploaded',
          blob: blob('image'),
        })
      },
    )

    test('known dimensions and MIME type are not read again', async () => {
      const {sourceMetadata, compressImage} = await runImage({
        media: {mimeType: 'image/webp'},
      })

      expect(compressImage).toHaveBeenCalled()
      expect(sourceMetadata).toHaveBeenCalledWith('post-1', 'image-1', {
        width: 1200,
        height: 800,
        mimeType: 'image/webp',
      })
    })

    test('unreadable dimensions fail as terminal validation before compression', async () => {
      const {statuses, compressImage} = await runImage({
        media: {width: undefined, height: undefined},
        getImageDimensions: () => Promise.resolve({width: 0, height: 0}),
      })

      expect(compressImage).not.toHaveBeenCalled()
      expect(statuses.at(-1)).toMatchObject({
        state: 'failed',
        code: 'invalid-image-dimensions',
        retryable: false,
      })
    })
  })

  test('handles an immediately completed video and uploads captions separately', async () => {
    const statuses: UploadStatus[] = []
    const captionUpload = jest.fn(() =>
      Promise.resolve({blob: blob('caption')}),
    )
    const uploadVideo = jest.fn(() =>
      Promise.resolve({
        state: 'JOB_STATE_COMPLETED',
        jobId: 'job-1',
        blob: blob('video'),
      }),
    )
    startVideoUpload({
      postId: 'post-1',
      mediaId: 'video-1',
      media: video(),
      ...runtime,
      ...fakeVideoDependencies({
        getVideoMetadata: () =>
          Promise.resolve({
            uri: 'file:///source.mp4',
            mimeType: 'video/mp4',
            width: 1920,
            height: 1080,
            duration: 1000,
          }),
        compressVideo: () =>
          Promise.resolve({
            uri: 'file:///compressed.mp4',
            size: 100,
            mimeType: 'video/mp4',
          }),
        uploadVideo: uploadVideo as never,
        uploadBlob: captionUpload,
      }),
      setUploadStatus: (_post, _media, status) => statuses.push(status),
    })
    await settle()

    /* The shared video API still calls the account PDS URL `dispatchUrl`. */
    expect(uploadVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        client: pdsClient,
        dispatchUrl: 'https://pds.example',
        i18n,
      }),
    )
    expect(captionUpload).toHaveBeenCalledWith(
      pdsClient,
      expect.any(Blob),
      'text/vtt',
    )
    expect(statuses.at(-1)).toEqual({
      state: 'uploaded',
      blob: blob('video'),
      captionBlobs: [{lang: 'en', blob: blob('caption')}],
    })
  })

  test('polls unfinished video jobs and preserves a completed blob when captions fail', async () => {
    const statuses: UploadStatus[] = []
    const uploadBlob = jest.fn(() =>
      Promise.reject(new Error('caption upload failed')),
    )
    const createVideoServiceClient = jest.fn(() => ({
      call: jest.fn(() =>
        Promise.resolve({
          jobStatus: {
            state: 'JOB_STATE_COMPLETED',
            jobId: 'job-1',
            blob: blob('video'),
          },
        }),
      ),
    }))
    startVideoUpload({
      postId: 'post-1',
      mediaId: 'video-1',
      media: video(),
      ...runtime,
      ...fakeVideoDependencies({
        getVideoMetadata: () =>
          Promise.resolve({
            uri: 'file:///source.mp4',
            mimeType: 'video/mp4',
            width: 1920,
            height: 1080,
            duration: 1000,
          }),
        compressVideo: () =>
          Promise.resolve({
            uri: 'file:///compressed.mp4',
            size: 100,
            mimeType: 'video/mp4',
          }),
        uploadVideo: (() =>
          Promise.resolve({
            state: 'JOB_STATE_ENCODING',
            jobId: 'job-1',
          })) as never,
        uploadBlob,
        createVideoServiceClient: createVideoServiceClient as never,
        sleep: () => Promise.resolve(),
      }),
      setUploadStatus: (_post, _media, status) => statuses.push(status),
    })
    await settle()

    expect(createVideoServiceClient).toHaveBeenCalled()
    expect(statuses.at(-1)).toMatchObject({
      state: 'failed',
      blob: blob('video'),
      retryable: true,
    })
  })
})
