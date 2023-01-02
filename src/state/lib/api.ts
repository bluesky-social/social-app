/**
 * The environment is a place where services and shared dependencies between
 * models live. They are made available to every model via dependency injection.
 */

// import {ReactNativeStore} from './auth'
import {
  sessionClient as AtpApi,
  APP_BSKY_GRAPH,
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
} from '@atproto/api'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from '../models/root-store'
import {extractEntities} from '../../lib/strings'
import {isNetworkError} from '../../lib/errors'
import {downloadAndResize} from '../../lib/images'
import {getLikelyType, LikelyType, getLinkMeta} from '../../lib/link-meta'

const TIMEOUT = 10e3 // 10s

export function doPolyfill() {
  AtpApi.xrpc.fetch = fetchHandler
}

export async function post(
  store: RootStoreModel,
  text: string,
  replyTo?: string,
  images?: string[],
  knownHandles?: Set<string>,
  onStateChange?: (state: string) => void,
) {
  let embed: AppBskyEmbedImages.Main | AppBskyEmbedExternal.Main | undefined
  let reply

  onStateChange?.('Processing...')
  const entities = extractEntities(text, knownHandles)
  if (entities) {
    for (const ent of entities) {
      if (ent.type === 'mention') {
        const prof = await store.profiles.getProfile(ent.value)
        ent.value = prof.data.did
      }
    }
  }

  if (images?.length) {
    embed = {
      $type: 'app.bsky.embed.images',
      images: [],
    } as AppBskyEmbedImages.Main
    let i = 1
    for (const image of images) {
      onStateChange?.(`Uploading image #${i++}...`)
      const res = await store.api.com.atproto.blob.upload(
        image, // this will be special-cased by the fetch monkeypatch in /src/state/lib/api.ts
        {encoding: 'image/jpeg'},
      )
      embed.images.push({
        image: {
          cid: res.data.cid,
          mimeType: 'image/jpeg',
        },
        alt: '', // TODO supply alt text
      })
    }
  }

  if (!embed && entities) {
    const link = entities.find(
      ent =>
        ent.type === 'link' &&
        getLikelyType(ent.value || '') === LikelyType.HTML,
    )
    if (link) {
      try {
        onStateChange?.(`Fetching link metadata...`)
        let thumb
        const linkMeta = await getLinkMeta(link.value)
        if (linkMeta.image) {
          onStateChange?.(`Downloading link thumbnail...`)
          const thumbLocal = await downloadAndResize({
            uri: linkMeta.image,
            width: 250,
            height: 250,
            mode: 'contain',
            maxSize: 100000,
            timeout: 15e3,
          }).catch(() => undefined)
          if (thumbLocal) {
            onStateChange?.(`Uploading link thumbnail...`)
            let encoding
            if (thumbLocal.uri.endsWith('.png')) {
              encoding = 'image/png'
            } else if (
              thumbLocal.uri.endsWith('.jpeg') ||
              thumbLocal.uri.endsWith('.jpg')
            ) {
              encoding = 'image/jpeg'
            } else {
              store.log.warn(
                'Unexpected image format for thumbnail, skipping',
                thumbLocal.uri,
              )
            }
            if (encoding) {
              const thumbUploadRes = await store.api.com.atproto.blob.upload(
                thumbLocal.uri, // this will be special-cased by the fetch monkeypatch in /src/state/lib/api.ts
                {encoding},
              )
              thumb = {
                cid: thumbUploadRes.data.cid,
                mimeType: encoding,
              }
            }
          }
        }
        embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: link.value,
            title: linkMeta.title || linkMeta.url,
            description: linkMeta.description || '',
            thumb,
          },
        } as AppBskyEmbedExternal.Main
      } catch (e: any) {
        store.log.warn(
          `Failed to fetch link meta for ${link.value}`,
          e.toString(),
        )
      }
    }
  }

  if (replyTo) {
    const replyToUrip = new AtUri(replyTo)
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

  try {
    onStateChange?.(`Posting...`)
    return await store.api.app.bsky.feed.post.create(
      {did: store.me.did || ''},
      {
        text,
        reply,
        embed,
        entities,
        createdAt: new Date().toISOString(),
      },
    )
  } catch (e: any) {
    console.error(`Failed to create post: ${e.toString()}`)
    if (isNetworkError(e)) {
      throw new Error(
        'Post failed to upload. Please check your Internet connection and try again.',
      )
    } else {
      throw e
    }
  }
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
  } else if (
    typeof reqBody === 'string' &&
    (reqBody.startsWith('/') || reqBody.startsWith('file:'))
  ) {
    // NOTE
    // React native treats bodies with {uri: string} as file uploads to pull from cache
    // -prf
    reqBody = {uri: reqBody}
  }

  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), TIMEOUT)

  const res = await fetch(reqUri, {
    method: reqMethod,
    headers: reqHeaders,
    body: reqBody,
    signal: controller.signal,
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

  clearTimeout(to)

  return {
    status: resStatus,
    headers: resHeaders,
    body: resBody,
  }
}
