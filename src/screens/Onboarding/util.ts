import {TID} from '@atproto/common-web'
import {type $Typed} from '@atproto/lex'
import {type Client} from '@atproto/lex-client'
import {
  type AtIdentifierString,
  type DidString,
  toDatetimeString,
} from '@atproto/syntax'
import chunk from 'lodash.chunk'

import {until} from '#/lib/async/until'
import {app, com} from '#/lexicons'

export async function bulkWriteFollows(
  pdsClient: Client,
  appviewClient: Client,
  dids: string[],
  via?: com.atproto.repo.strongRef.Main,
) {
  const did = pdsClient.assertDid

  const followRecords: $Typed<app.bsky.graph.follow.Main>[] = dids.map(did => {
    return {
      $type: 'app.bsky.graph.follow',
      subject: did as DidString,
      createdAt: toDatetimeString(new Date()),
      via,
    }
  })

  const followWrites: $Typed<com.atproto.repo.applyWrites.Create>[] =
    followRecords.map(r => ({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.bsky.graph.follow',
      rkey: TID.nextStr(),
      value: r,
    }))

  const chunks = chunk(followWrites, 50)
  for (const chunk of chunks) {
    await pdsClient.call(com.atproto.repo.applyWrites, {
      repo: did,
      writes: chunk,
    })
  }
  await whenFollowsIndexed(appviewClient, did, res => !!res.follows.length)

  const followUris = new Map<string, string>()
  for (const r of followWrites) {
    followUris.set(
      r.value.subject as string,
      `at://${did}/app.bsky.graph.follow/${r.rkey}`,
    )
  }
  return followUris
}

async function whenFollowsIndexed(
  appviewClient: Client,
  actor: string,
  fn: (res: app.bsky.graph.getFollows.$OutputBody) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      appviewClient.call(app.bsky.graph.getFollows, {
        actor: actor as AtIdentifierString,
        limit: 1,
      }),
  )
}
