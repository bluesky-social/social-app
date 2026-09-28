import {type ComposerAdapterErrorCode} from '#/components/ComposerV2/adapters'
import {type ComposerV2PlanErrorCode} from '#/components/ComposerV2/planner'
import {type LinkResolutionFailureCode} from '#/components/ComposerV2/store/types'

/** Structural context only: never include text, paths, records, or UI messages. */
export type ComposerV2ErrorEvent = {
  kind: 'validation' | 'operational' | 'unexpected'
  recovery: 'retry' | 'edit' | 'reconcile' | 'none'
  postId?: string
  mediaId?: string
} & (
  | {
      source: 'initialization'
      code:
        | ComposerAdapterErrorCode
        | 'initial-state-failed'
        | 'scenario-build-failed'
    }
  | {source: 'upload'; code: string}
  | {
      source: 'uri-resolution'
      code: LinkResolutionFailureCode
      slot: 'record' | 'media'
    }
  | {source: 'planner'; code: ComposerV2PlanErrorCode}
  | {
      source: 'writer'
      code: 'write-precondition-failed' | 'apply-writes-failed'
      /** Local post identities in the dispatched plan; never full records. */
      postIds?: readonly string[]
    }
)

/**
 * Optional synchronous session policy. The separate, untrusted cause is for
 * deliberate caller handling only: do not display, serialize, or log it by
 * default. Results and source-local failure state remain authoritative.
 * Register with createThreadStore, then pass store.reportError to operation
 * callers. It is inert after destruction; supersedable callers must also
 * guard their own attempt token. Report at one boundary, not again on catch.
 * Ordinary planner preflight/record validation stays in the returned result.
 */
export type ComposerV2OnError = (
  event: ComposerV2ErrorEvent,
  cause?: unknown,
) => void

/** Reporting is best-effort and must never replace an operation's outcome. */
export function reportComposerV2Error(
  onError: ComposerV2OnError | undefined,
  event: ComposerV2ErrorEvent,
  cause?: unknown,
) {
  try {
    onError?.(event, cause)
  } catch {
    // A reporting failure is not another composer failure.
  }
}

/** Intentional cancellation is not an operational failure. */
export function isComposerV2Cancellation(cause: unknown) {
  return cause instanceof Error && cause.name === 'AbortError'
}
