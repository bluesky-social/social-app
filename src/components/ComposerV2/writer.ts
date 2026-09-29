import {type Client} from '@atproto/lex'

import {
  type ComposerV2OnError,
  reportComposerV2Error,
} from '#/components/ComposerV2/errors'
import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import {com} from '#/lexicons'

/**
 * Publish one successful ComposerV2 plan through its authenticated PDS client.
 * Planning remains no-write; call this only from an explicit publish action.
 * DebugComposer is the current caller; production composer UI wiring is
 * deferred to a separate PR. Callers must serialize or disable
 * duplicate submissions. If a transport failure leaves the outcome ambiguous,
 * retain this exact plan for reconciliation and do not blindly retry or create
 * a new plan with different record keys. This function never retries writes.
 */
export async function writeComposerV2Plan({
  plan,
  pdsClient,
  onError,
}: {
  plan: ComposerV2Plan
  pdsClient: Client
  onError?: ComposerV2OnError
}): Promise<{uris: string[]}> {
  try {
    if (plan.ok !== true) {
      throw new Error('Cannot write an unsuccessful ComposerV2 plan')
    }

    const did = pdsClient.assertDid
    if (!did) {
      throw new Error('An authenticated PDS account is required')
    }
    if (did !== plan.input.repo) {
      throw new Error(
        'ComposerV2 plan repo does not match the authenticated PDS',
      )
    }
    if (plan.input.validate !== true) {
      throw new Error('ComposerV2 plan must enable server-side validation')
    }
  } catch (cause) {
    reportComposerV2Error({
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
    /* Any rejection after dispatch may have committed, including transport
     * aborts. Preserve the SDK error and exact plan for caller reconciliation. */
    reportComposerV2Error({
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
