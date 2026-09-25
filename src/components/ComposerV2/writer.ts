import {type Client} from '@atproto/lex'

import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import {com} from '#/lexicons'

/**
 * Publish one successful ComposerV2 plan through its authenticated PDS client.
 * Planning remains no-write; the debug tester and production composer do not
 * call this explicit publishing boundary. Callers must serialize or disable
 * duplicate submissions. If a transport failure leaves the outcome ambiguous,
 * retain this exact plan for reconciliation and do not blindly retry or create
 * a new plan with different record keys. This function never retries writes.
 */
export async function writeComposerV2Plan({
  plan,
  pdsClient,
}: {
  plan: ComposerV2Plan
  pdsClient: Client
}): Promise<{uris: string[]}> {
  if (plan.ok !== true) {
    throw new Error('Cannot write an unsuccessful ComposerV2 plan')
  }

  const did = pdsClient.assertDid
  if (!did) {
    throw new Error('An authenticated PDS account is required')
  }
  if (did !== plan.input.repo) {
    throw new Error('ComposerV2 plan repo does not match the authenticated PDS')
  }
  if (plan.input.validate !== true) {
    throw new Error('ComposerV2 plan must enable server-side validation')
  }

  await pdsClient.call(com.atproto.repo.applyWrites, plan.input)
  return {uris: plan.posts.map(post => post.uri)}
}
