import {type ImagePickerAsset} from 'expo-image-picker'
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

function image(): PostMediaImage {
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

const pdsClient = {} as Client
const runtime = {pdsClient, pdsUrl: 'https://pds.example', i18n}

afterEach(() => {
  mockIsWeb = false
})

function sourceAsset(
  overrides: Partial<ImagePickerAsset> = {},
): ImagePickerAsset {
  return {
    uri: 'file:///source.mp4',
    mimeType: 'video/mp4',
    width: 1920,
    height: 1080,
    duration: 1000,
    ...overrides,
  }
}

/**
 * Runs the real video worker against a fake source and compressor, returning
 * the fakes so a test can assert which stages ran.
 */
async function runVideo({
  asset,
  compressed = {
    uri: 'file:///compressed.mp4',
    size: 100,
    mimeType: 'video/mp4',
  },
  compressError,
}: {
  asset: ImagePickerAsset
  compressed?: CompressedVideo
  compressError?: Error
}) {
  const statuses: UploadStatus[] = []
  const prepared = jest.fn()
  const compressVideo = jest.fn(() =>
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
    media: video({
      mimeType: asset.mimeType ?? undefined,
      captions: [],
      file: mockIsWeb ? ({size: 1} as File) : undefined,
    }),
    ...runtime,
    ...fakeVideoDependencies({
      getVideoMetadata: () => Promise.resolve(asset),
      compressVideo,
      uploadVideo: uploadVideo as never,
    }),
    setMediaCompressionResult: prepared,
    setUploadStatus: (_post, _media, status) => statuses.push(status),
  })
  await settle()
  return {statuses, prepared, compressVideo, uploadVideo}
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
      const asset = sourceAsset({fileSize: VIDEO_MAX_SIZE * 2})
      const {statuses, prepared, compressVideo, uploadVideo} = await runVideo({
        asset,
        compressed: {
          uri: 'file:///compressed.mp4',
          size: VIDEO_MAX_SIZE - 1,
          mimeType: 'video/mp4',
        },
      })

      expect(compressVideo).toHaveBeenCalledWith(asset, expect.anything())
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
      const asset = sourceAsset({
        uri: 'file:///source.mkv',
        mimeType: 'video/x-matroska',
        fileSize: 1000,
      })
      const {statuses, compressVideo, uploadVideo} = await runVideo({asset})

      expect(compressVideo).toHaveBeenCalledWith(asset, expect.anything())
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
            asset: sourceAsset({fileSize: VIDEO_MAX_SIZE * 2}),
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
        asset: sourceAsset(),
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
      'native: rejects %s before compressing a transcodable oversized source',
      async (_case, overrides, code) => {
        const {statuses, compressVideo} = await runVideo({
          asset: sourceAsset({
            mimeType: 'video/x-matroska',
            fileSize: VIDEO_MAX_SIZE * 2,
            ...overrides,
          }),
        })

        expect(compressVideo).not.toHaveBeenCalled()
        expect(statuses.at(-1)).toMatchObject({
          state: 'failed',
          code,
          retryable: false,
        })
      },
    )

    test.each([
      {platform: 'native', isWeb: false, mimeType: 'application/pdf'},
      {platform: 'native', isWeb: false, mimeType: 'image/png'},
      {platform: 'native', isWeb: false, mimeType: undefined},
      {platform: 'web', isWeb: true, mimeType: 'video/x-matroska'},
    ])(
      '$platform: rejects a $mimeType source it cannot upload or transcode',
      async ({isWeb, mimeType}) => {
        mockIsWeb = isWeb
        const {statuses, compressVideo} = await runVideo({
          asset: sourceAsset({mimeType}),
        })

        expect(compressVideo).not.toHaveBeenCalled()
        expect(statuses.at(-1)).toMatchObject({
          state: 'failed',
          code: 'unsupported-video-format',
          retryable: false,
        })
      },
    )

    test.each([
      ['native', false, {fileSize: VIDEO_MAX_SIZE + 1}],
      ['web', true, {file: {size: VIDEO_MAX_SIZE + 1} as File}],
    ])(
      '%s: rejects an oversized GIF before compression since GIFs pass through',
      async (_platform, isWeb, size) => {
        mockIsWeb = isWeb
        const {statuses, compressVideo} = await runVideo({
          asset: sourceAsset({mimeType: 'image/gif', ...size}),
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
          asset: sourceAsset({mimeType: 'image/gif', fileSize: 1000}),
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
        asset: sourceAsset({
          file: {size: VIDEO_MAX_SIZE * 2} as File,
          mimeType: 'video/webm',
        }),
      })

      expect(compressVideo).toHaveBeenCalled()
      expect(uploadVideo).toHaveBeenCalled()
      expect(statuses.at(-1)).toMatchObject({state: 'uploaded'})
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
