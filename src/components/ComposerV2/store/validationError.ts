import {type UploadFailureCode} from './types'

/**
 * A source that can never upload as picked: a bad dimension, an unsupported
 * format, or bytes that cannot be read. Non-retryable, unlike a transient
 * compression or network failure.
 */
export class ValidationError extends Error {
  constructor(
    public code: Extract<
      UploadFailureCode,
      | 'invalid-image-dimensions'
      | 'unsupported-video-format'
      | 'invalid-video-dimensions'
      | 'video-too-long'
      | 'unreadable-media'
    >,
  ) {
    super(code)
    this.name = 'ValidationError'
  }
}
