import {type BlobRef, type Client} from '@atproto/lex'
import {describe, expect, jest, test} from '@jest/globals'

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
      __overrides: {
        compressImage,
        uploadBlob,
      },
      setPrepared: prepared,
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
      __overrides: {
        compressImage: compressImage as never,
        uploadBlob: uploadBlob as never,
      },
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
      __overrides: {
        getVideoMetadata: () =>
          Promise.resolve({
            uri: 'file:///source.mp4',
            mimeType: 'video/mp4',
            width: 1920,
            height: 1080,
            duration: 10 * 60 * 1000 + 1,
          }),
        compressVideo: compressVideo as never,
      },
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
      __overrides: {
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
      },
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
      __overrides: {
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
      },
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
