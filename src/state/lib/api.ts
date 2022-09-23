/**
 * The environment is a place where services and shared dependencies between
 * models live. They are made available to every model via dependency injection.
 */

import RNFetchBlob from 'rn-fetch-blob'
// import {ReactNativeStore} from './auth'
import AdxApi, {ServiceClient} from '../../third-party/api'
import {AdxUri} from '../../third-party/uri'
import * as storage from './storage'

export async function setup(adx: ServiceClient) {
  AdxApi.xrpc.fetch = fetchHandler
}

export async function post(
  adx: ServiceClient,
  user: string,
  text: string,
  replyToUri?: string,
) {
  let reply
  if (replyToUri) {
    const replyToUrip = new AdxUri(replyToUri)
    const parentPost = await adx.todo.social.post.get({
      nameOrDid: replyToUrip.host,
      tid: replyToUrip.recordKey,
    })
    if (parentPost) {
      reply = {
        root: parentPost.value.reply?.root || parentPost.uri,
        parent: parentPost.uri,
      }
    }
  }
  return await adx.todo.social.post.create(
    {did: user},
    {
      text,
      reply,
      createdAt: new Date().toISOString(),
    },
  )
}

export async function like(adx: ServiceClient, user: string, uri: string) {
  return await adx.todo.social.like.create(
    {did: user},
    {
      subject: uri,
      createdAt: new Date().toISOString(),
    },
  )
}

export async function unlike(adx: ServiceClient, user: string, uri: string) {
  throw new Error('TODO')
}

export async function repost(adx: ServiceClient, user: string, uri: string) {
  return await adx.todo.social.repost.create(
    {did: user},
    {
      subject: uri,
      createdAt: new Date().toISOString(),
    },
  )
}

export async function unrepost(adx: ServiceClient, user: string, uri: string) {
  throw new Error('TODO')
}

export async function follow(
  adx: ServiceClient,
  user: string,
  subject: string,
) {
  return await adx.todo.social.follow.create(
    {did: user},
    {
      subject,
      createdAt: new Date().toISOString(),
    },
  )
}

export async function unfollow(
  adx: ServiceClient,
  user: string,
  subject: {did: string},
) {
  throw new Error('TODO')
}

export async function updateProfile(
  adx: ServiceClient,
  user: string,
  profile: bsky.Profile.Record,
) {
  throw new Error('TODO')
}

interface FetchHandlerResponse {
  status: number
  headers: Record<string, string>
  body: ArrayBuffer | undefined
}

async function fetchHandler(
  httpUri: string,
  httpMethod: string,
  httpHeaders: Record<string, string>,
  httpReqBody: any,
): Promise<FetchHandlerResponse> {
  httpHeaders['Authorization'] = 'did:test:alice' // DEBUG
  const res = await RNFetchBlob.fetch(
    /** @ts-ignore method coersion, it's fine -prf */
    httpMethod,
    httpUri,
    httpHeaders,
    httpReqBody,
  )

  const status = res.info().status
  const headers = (res.info().headers || {}) as Record<string, string>
  const mimeType = headers['Content-Type'] || headers['content-type']
  let resBody
  if (mimeType) {
    if (mimeType.startsWith('application/json')) {
      resBody = res.json()
    } else if (mimeType.startsWith('text/')) {
      resBody = res.text()
    } else {
      resBody = res.base64()
    }
  }
  return {
    status,
    headers,
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
