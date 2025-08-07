import {
  type $Typed,
  type AppGndrGraphFollow,
  type AppGndrGraphGetFollows,
  type ComAtprotoRepoApplyWrites,
  type GndrAgent,
} from '@gander-social-atproto/api'
import {TID} from '@gander-social-atproto/common-web'
import chunk from 'lodash.chunk'

import {until} from '#/lib/async/until'

export async function bulkWriteFollows(agent: GndrAgent, dids: string[]) {
  const session = agent.session

  if (!session) {
    throw new Error(`bulkWriteFollows failed: no session`)
  }

  const followRecords: $Typed<AppGndrGraphFollow.Record>[] = dids.map(did => {
    return {
      $type: 'app.gndr.graph.follow',
      subject: did,
      createdAt: new Date().toISOString(),
    }
  })

  const followWrites: $Typed<ComAtprotoRepoApplyWrites.Create>[] =
    followRecords.map(r => ({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.gndr.graph.follow',
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

  const followUris = new Map()
  for (const r of followWrites) {
    followUris.set(
      r.value.subject,
      `at://${session.did}/app.gndr.graph.follow/${r.rkey}`,
    )
  }
  return followUris
}

async function whenFollowsIndexed(
  agent: GndrAgent,
  actor: string,
  fn: (res: AppGndrGraphGetFollows.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      agent.app.gndr.graph.getFollows({
        actor,
        limit: 1,
      }),
  )
}
