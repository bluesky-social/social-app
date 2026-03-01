import {
  type $Typed,
  type AppBskyGraphFollow,
  type AppBskyGraphGetFollows,
  type BskyAgent,
  type ComAtprotoRepoApplyWrites,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import chunk from 'lodash.chunk'

import {until} from '#/lib/async/until'

export async function bulkWriteFollows(
  agent: BskyAgent,
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

async function whenFollowsIndexed(
  agent: BskyAgent,
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
