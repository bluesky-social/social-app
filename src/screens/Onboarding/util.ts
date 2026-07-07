import {
  type $Typed,
  type AppBskyGraphFollow,
  type AppBskyGraphGetFollows,
  type AtpAgent,
  type ComAtprotoRepoApplyWrites,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import chunk from 'lodash.chunk'

import {until} from '#/lib/async/until'
import {type ComputedBrandConfig} from '#/lib/community/types'

export async function bulkWriteFollows(
  agent: AtpAgent,
  dids: string[],
  via?: ComAtprotoRepoStrongRef.Main,
) {
  const session = agent.session

  if (!session) {
    throw new Error(`bulkWriteFollows failed: no session`)
  }

  const followRecords: $Typed<AppBskyGraphFollow.Record>[] = dids.map(did => {
    return {
      $type: 'app.bsky.graph.follow',
      subject: did,
      createdAt: new Date().toISOString(),
      via,
    }
  })

  const followWrites: $Typed<ComAtprotoRepoApplyWrites.Create>[] =
    followRecords.map(r => ({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.bsky.graph.follow',
      rkey: TID.nextStr(),
      value: r,
    }))

  const chunks = chunk(followWrites, 50)
  for (const chunk of chunks) {
    await agent.com.atproto.repo.applyWrites({
      repo: session.did,
      writes: chunk,
    })
  }
  await whenFollowsIndexed(agent, session.did, res => !!res.data.follows.length)

  const followUris = new Map<string, string>()
  for (const r of followWrites) {
    followUris.set(
      r.value.subject as string,
      `at://${session.did}/app.bsky.graph.follow/${r.rkey}`,
    )
  }
  return followUris
}

/**
 * Resolves which starter pack URI to use during onboarding.
 * Prefers the active starter pack (from a link click) over the community config default.
 */
export function resolveStarterPackUri(
  activeStarterPackUri: string | undefined,
  brandConfig: ComputedBrandConfig,
): string | undefined {
  return activeStarterPackUri || brandConfig.onboarding.starterPack || undefined
}

/**
 * Builds the deduplicated list of DIDs to auto-follow during onboarding.
 * Merges hardcoded community DIDs, brand config auto-follow DIDs,
 * and starter pack list member DIDs.
 */
export function resolveFollowDids(
  hardcodedDids: string[],
  brandConfig: ComputedBrandConfig,
  starterPackMemberDids: string[],
): string[] {
  return [
    ...new Set([
      ...hardcodedDids,
      ...brandConfig.onboarding.autoFollowDids,
      ...starterPackMemberDids,
    ]),
  ]
}

async function whenFollowsIndexed(
  agent: AtpAgent,
  actor: string,
  fn: (res: AppBskyGraphGetFollows.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      agent.app.bsky.graph.getFollows({
        actor,
        limit: 1,
      }),
  )
}
