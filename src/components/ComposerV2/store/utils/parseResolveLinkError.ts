import {EmbeddingDisabledError} from '#/lib/api/resolve'
import {type LinkResolutionFailureCode} from '#/components/ComposerV2/store/types'

export type ParsedResolveLinkError = {
  code: LinkResolutionFailureCode
  /**
   * Whether the failure is worth retrying. Today only EmbeddingDisabledError
   * is permanent (the post's author has forbidden quoting); anything else
   * is a transient or unknown failure and the caller should attach a
   * `retry()` to the failed state.
   */
  isRetryable: boolean
}

/**
 * Classify a thrown error from `resolveLink` into a stable failure code
 * and a retryability flag. Centralizes the retry-policy decision so the
 * store doesn't repeat the `code === 'embedding-disabled'` check at every
 * failure call site.
 */
export function parseResolveLinkError(err: unknown): ParsedResolveLinkError {
  if (err instanceof EmbeddingDisabledError) {
    return {code: 'embedding-disabled', isRetryable: false}
  }
  return {code: 'unknown', isRetryable: true}
}
