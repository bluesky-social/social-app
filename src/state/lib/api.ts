/**
 * The environment is a place where services and shared dependencies between
 * models live. They are made available to every model via dependency injection.
 */

// import {ReactNativeStore} from './auth'
import {sessionClient as AtpApi} from '../../third-party/api'
import * as Profile from '../../third-party/api/src/client/types/app/bsky/actor/profile'
import * as Post from '../../third-party/api/src/client/types/app/bsky/feed/post'
import {AtUri} from '../../third-party/uri'
import {APP_BSKY_GRAPH} from '../../third-party/api'
import {RootStoreModel} from '../models/root-store'
import {extractEntities} from '../../view/lib/strings'

export function doPolyfill() {
  AtpApi.xrpc.fetch = fetchHandler
}

export async function post(
  store: RootStoreModel,
  text: string,
  replyTo?: Post.PostRef,
) {
  let reply
  if (replyTo) {
    const replyToUrip = new AtUri(replyTo.uri)
    const parentPost = await store.api.app.bsky.feed.post.get({
      user: replyToUrip.host,
      rkey: replyToUrip.rkey,
    })
    if (parentPost) {
      const parentRef = {
        uri: parentPost.uri,
        cid: parentPost.cid,
      }
      reply = {
        root: parentPost.value.reply?.root || parentRef,
        parent: parentRef,
      }
    }
  }
  const entities = extractEntities(text)
  return await store.api.app.bsky.feed.post.create(
    {did: store.me.did || ''},
    {
      text,
      reply,
      entities,
      createdAt: new Date().toISOString(),
    },
  )
}

export async function upvote(store: RootStoreModel, uri: string, cid: string) {
  return await store.api.app.bsky.feed.vote.create(
    {did: store.me.did || ''},
    {
      subject: {uri, cid},
      direction: 'up',
      createdAt: new Date().toISOString(),
    },
  )
}

export async function unupvote(store: RootStoreModel, upvoteUri: string) {
  const urip = new AtUri(upvoteUri)
  return await store.api.app.bsky.feed.vote.delete({
    did: urip.hostname,
    rkey: urip.rkey,
  })
}

export async function downvote(
  store: RootStoreModel,
  uri: string,
  cid: string,
) {
  return await store.api.app.bsky.feed.vote.create(
    {did: store.me.did || ''},
    {
      subject: {uri, cid},
      direction: 'down',
      createdAt: new Date().toISOString(),
    },
  )
}

export async function undownvote(store: RootStoreModel, downvoteUri: string) {
  const urip = new AtUri(downvoteUri)
  return await store.api.app.bsky.feed.vote.delete({
    did: urip.hostname,
    rkey: urip.rkey,
  })
}

export async function repost(store: RootStoreModel, uri: string, cid: string) {
  return await store.api.app.bsky.feed.repost.create(
    {did: store.me.did || ''},
    {
      subject: {uri, cid},
      createdAt: new Date().toISOString(),
    },
  )
}

export async function unrepost(store: RootStoreModel, repostUri: string) {
  const repostUrip = new AtUri(repostUri)
  return await store.api.app.bsky.feed.repost.delete({
    did: repostUrip.hostname,
    rkey: repostUrip.rkey,
  })
}

export async function follow(
  store: RootStoreModel,
  subjectDid: string,
  subjectDeclarationCid: string,
) {
  return await store.api.app.bsky.graph.follow.create(
    {did: store.me.did || ''},
    {
      subject: {
        did: subjectDid,
        declarationCid: subjectDeclarationCid,
      },
      createdAt: new Date().toISOString(),
    },
  )
}

export async function unfollow(store: RootStoreModel, followUri: string) {
  const followUrip = new AtUri(followUri)
  return await store.api.app.bsky.graph.follow.delete({
    did: followUrip.hostname,
    rkey: followUrip.rkey,
  })
}

export async function updateProfile(
  store: RootStoreModel,
  did: string,
  modifyFn: (existing?: Profile.Record) => Profile.Record,
) {
  const res = await store.api.app.bsky.actor.profile.list({
    user: did || '',
  })
  const existing = res.records[0]
  await store.api.app.bsky.actor.updateProfile({
    did: did || '',
    ...modifyFn(existing?.value),
  })
}

export async function inviteToScene(
  store: RootStoreModel,
  sceneDid: string,
  subjectDid: string,
  subjectDeclarationCid: string,
): Promise<string> {
  const res = await store.api.app.bsky.graph.assertion.create(
    {
      did: sceneDid,
    },
    {
      subject: {
        did: subjectDid,
        declarationCid: subjectDeclarationCid,
      },
      assertion: APP_BSKY_GRAPH.AssertMember,
      createdAt: new Date().toISOString(),
    },
  )
  return res.uri
}

interface Confirmation {
  originator: {
    did: string
    declarationCid: string
  }
  assertion: {
    uri: string
    cid: string
  }
}
export async function acceptSceneInvite(
  store: RootStoreModel,
  details: Confirmation,
): Promise<string> {
  const res = await store.api.app.bsky.graph.confirmation.create(
    {
      did: store.me.did || '',
    },
    {
      ...details,
      createdAt: new Date().toISOString(),
    },
  )
  return res.uri
}

interface FetchHandlerResponse {
  status: number
  headers: Record<string, string>
  body: ArrayBuffer | undefined
}

async function fetchHandler(
  reqUri: string,
  reqMethod: string,
  reqHeaders: Record<string, string>,
  reqBody: any,
): Promise<FetchHandlerResponse> {
  const reqMimeType = reqHeaders['Content-Type'] || reqHeaders['content-type']
  if (reqMimeType && reqMimeType.startsWith('application/json')) {
    reqBody = JSON.stringify(reqBody)
  }

  const res = await fetch(reqUri, {
    method: reqMethod,
    headers: reqHeaders,
    body: reqBody,
  })

  const resStatus = res.status
  const resHeaders: Record<string, string> = {}
  res.headers.forEach((value: string, key: string) => {
    resHeaders[key] = value
  })
  const resMimeType = resHeaders['Content-Type'] || resHeaders['content-type']
  let resBody
  if (resMimeType) {
    if (resMimeType.startsWith('application/json')) {
      resBody = await res.json()
    } else if (resMimeType.startsWith('text/')) {
      resBody = await res.text()
    } else {
      throw new Error('TODO: non-textual response body')
    }
  }
  return {
    status: resStatus,
    headers: resHeaders,
    body: resBody,
  }
  // const res = await fetch(httpUri, {
  //   method: httpMethod,
  //   headers: httpHeaders,
  //   body: encodeMethodCallBody(httpHeaders, httpReqBody),
  // })
  // const resBody = await res.arrayBuffer()
  // return {
  //   status: res.status,
  //   headers: Object.fromEntries(res.headers.entries()),
  //   body: httpResponseBodyParse(res.headers.get('content-type'), resBody),
  // }
}
/*type WherePred = (_record: GetRecordResponseValidated) => Boolean
async function deleteWhere(
  coll: AdxRepoCollectionClient,
  schema: SchemaOpt,
  cond: WherePred,
) {
  const toDelete: string[] = []
  await iterateAll(coll, schema, record => {
    if (cond(record)) {
      toDelete.push(record.key)
    }
  })
  for (const key of toDelete) {
    await coll.del(key)
  }
  return toDelete.length
}

type IterateAllCb = (_record: GetRecordResponseValidated) => void
async function iterateAll(
  coll: AdxRepoCollectionClient,
  schema: SchemaOpt,
  cb: IterateAllCb,
) {
  let cursor
  let res: ListRecordsResponseValidated
  do {
    res = await coll.list(schema, {after: cursor, limit: 100})
    for (const record of res.records) {
      if (record.valid) {
        cb(record)
        cursor = record.key
      }
    }
  } while (res.records.length === 100)
}*/
