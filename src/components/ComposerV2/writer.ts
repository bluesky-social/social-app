import {type Client} from '@atproto/lex'

import {getErrorStatus} from '#/lib/xrpc-error'
import {
  type ComposerOnError,
  reportComposerError,
} from '#/components/ComposerV2/errors'
import {type ThreadPlan} from '#/components/ComposerV2/planner'
import {com} from '#/lexicons'

/**
 * The writer refused the plan before sending anything, so nothing was
 * written. Any other rejection may have committed.
 */
export class WritePreconditionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WritePreconditionError'
  }
}

/**
 * The server refused the write with a 4xx response, so nothing was written and
 * the same plan can be retried. `cause` is the original SDK error. Every other
 * post-dispatch failure may have committed and rethrows its raw cause.
 */
export class WriteRejectedError extends Error {
  readonly status: number

  constructor(status: number, cause: unknown) {
    super(`The server rejected the composer write (HTTP ${status})`, {cause})
    this.name = 'WriteRejectedError'
    this.status = status
  }
}

/**
 * Publish one successful thread plan through its authenticated PDS client.
 * Planning remains no-write; call this only from an explicit publish action.
 * DebugComposer is the current caller; production composer UI wiring is
 * deferred to a separate PR. Callers must serialize or disable
 * duplicate submissions. A 4xx refusal throws WriteRejectedError and
 * committed nothing. Any other failure (transport, abort, 5xx) leaves the
 * outcome ambiguous: retain this exact plan for reconciliation and do not
 * blindly retry or create a new plan with different record keys. This function
 * never retries writes.
 */
export async function writeThreadPlan({
  plan,
  pdsClient,
  onError,
}: {
  plan: ThreadPlan
  pdsClient: Client
  onError?: ComposerOnError
}): Promise<{uris: string[]}> {
  try {
    if (plan.ok !== true) {
      throw new WritePreconditionError(
        'Cannot write an unsuccessful thread plan',
      )
    }

    const did = pdsClient.assertDid
    if (!did) {
      throw new WritePreconditionError(
        'An authenticated PDS account is required',
      )
    }
    if (did !== plan.input.repo) {
      throw new WritePreconditionError(
        'Thread plan repo does not match the authenticated PDS',
      )
    }
    if (plan.input.validate !== true) {
      throw new WritePreconditionError(
        'Thread plan must enable server-side validation',
      )
    }
  } catch (cause) {
    reportComposerError({
      onError,
      event: {
        source: 'writer',
        code: 'write-precondition-failed',
        kind: 'unexpected',
        recovery: 'none',
      },
      cause,
    })
    throw cause
  }

  try {
    await pdsClient.call(com.atproto.repo.applyWrites, plan.input)
  } catch (cause) {
    /* applyWrites is atomic, so a 4xx response means nothing was written. */
    const status = getErrorStatus(cause)
    if (status !== undefined && status >= 400 && status < 500) {
      reportComposerError({
        onError,
        event: {
          source: 'writer',
          code: 'apply-writes-rejected',
          postIds: plan.posts.map(post => post.postId),
          kind: 'operational',
          recovery: 'retry',
        },
        cause,
      })
      throw new WriteRejectedError(status, cause)
    }
    /* Anything else after dispatch may have committed, including transport
     * aborts. Preserve the SDK error and exact plan for caller reconciliation. */
    reportComposerError({
      onError,
      event: {
        source: 'writer',
        code: 'apply-writes-failed',
        postIds: plan.posts.map(post => post.postId),
        kind: 'operational',
        recovery: 'reconcile',
      },
      cause,
    })
    throw cause
  }
  return {uris: plan.posts.map(post => post.uri)}
}
