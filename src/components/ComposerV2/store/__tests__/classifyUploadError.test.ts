import {XrpcError} from '@atproto/lex'
import {describe, expect, test} from '@jest/globals'

import {UploadLimitError, VideoTooLargeError} from '#/lib/media/video/errors'
import {
  classifyUploadError,
  type UploadFailureClassification,
  ValidationError,
  VideoJobError,
} from '#/components/ComposerV2/store/uploads'

const networkError = new TypeError('Network request failed')
const retryableXrpcError = Object.assign(Object.create(XrpcError.prototype), {
  shouldRetry: () => true,
}) as XrpcError

const validation = {retryable: false, kind: 'validation'} as const
const operational = {retryable: false, kind: 'operational'} as const

describe('classifyUploadError', () => {
  const cases: [
    string,
    {error: unknown; mediaKind: 'image' | 'video'},
    UploadFailureClassification,
  ][] = [
    [
      'invalid image dimensions',
      {
        error: new ValidationError('invalid-image-dimensions'),
        mediaKind: 'image',
      },
      {code: 'invalid-image-dimensions', ...validation},
    ],
    [
      'unsupported video format',
      {
        error: new ValidationError('unsupported-video-format'),
        mediaKind: 'video',
      },
      {code: 'unsupported-video-format', ...validation},
    ],
    [
      'invalid video dimensions',
      {
        error: new ValidationError('invalid-video-dimensions'),
        mediaKind: 'video',
      },
      {code: 'invalid-video-dimensions', ...validation},
    ],
    [
      'video too long',
      {error: new ValidationError('video-too-long'), mediaKind: 'video'},
      {code: 'video-too-long', ...validation},
    ],
    [
      'video too large',
      {error: new VideoTooLargeError(), mediaKind: 'video'},
      {code: 'video-too-large', ...validation},
    ],
    [
      'upload limit, carrying the shared message as detail',
      {error: new UploadLimitError('Try again tomorrow'), mediaKind: 'video'},
      {
        code: 'video-upload-limit',
        detail: 'Try again tomorrow',
        ...operational,
      },
    ],
    [
      'job rejected by validation',
      {
        error: new VideoJobError('bad', 'validation_failure'),
        mediaKind: 'video',
      },
      {code: 'video-rejected', ...operational},
    ],
    [
      'other job failure',
      {error: new VideoJobError('boom', 'other'), mediaKind: 'video'},
      {code: 'video-processing-failed', retryable: true, kind: 'operational'},
    ],
    [
      'job failure without a failure code',
      {error: new VideoJobError('boom'), mediaKind: 'video'},
      {code: 'video-processing-failed', retryable: true, kind: 'operational'},
    ],
    [
      'network error',
      {error: networkError, mediaKind: 'image'},
      {code: 'network', retryable: true, kind: 'operational'},
    ],
    [
      'retryable XRPC error',
      {error: retryableXrpcError, mediaKind: 'video'},
      {code: 'network', retryable: true, kind: 'operational'},
    ],
    [
      'unknown image error',
      {error: new Error('private'), mediaKind: 'image'},
      {code: 'image-failed', retryable: true, kind: 'unexpected'},
    ],
    [
      'unknown video error',
      {error: new Error('private'), mediaKind: 'video'},
      {code: 'video-failed', retryable: true, kind: 'unexpected'},
    ],
    [
      'non-error throw',
      {error: 'oops', mediaKind: 'video'},
      {code: 'video-failed', retryable: true, kind: 'unexpected'},
    ],
    /* Precedence: validation, too-large, limit, rejected job, network, then kind-specific. */
    [
      'a limit error that looks like a network error stays a limit',
      {error: new UploadLimitError(networkError.message), mediaKind: 'video'},
      {
        code: 'video-upload-limit',
        detail: networkError.message,
        ...operational,
      },
    ],
    [
      'a network-looking job failure is a network failure',
      {error: new VideoJobError(networkError.message), mediaKind: 'video'},
      {code: 'network', retryable: true, kind: 'operational'},
    ],
    [
      'a rejected job that looks like a network error stays rejected and not retryable',
      {
        error: new VideoJobError(networkError.message, 'validation_failure'),
        mediaKind: 'video',
      },
      {code: 'video-rejected', ...operational},
    ],
  ]

  test.each(cases)('%s', (_name, args, expected) => {
    expect(classifyUploadError(args)).toEqual(expected)
  })
})
