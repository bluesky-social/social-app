/**
 * The environment is a place where services and shared dependencies between
 * models live. They are made available to every model via dependency injection.
 */

// import {ReactNativeStore} from './auth'
import {
  sessionClient as AtpApi,
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
} from '@atproto/api'
import RNFS from 'react-native-fs'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from '../models/root-store'
import {extractEntities} from '../../lib/strings'
import {isNetworkError} from '../../lib/errors'
import {downloadAndResize} from '../../lib/images'
import {
  getLikelyType,
  LikelyType,
  getLinkMeta,
  LinkMeta,
} from '../../lib/link-meta'
import {Image} from '../../lib/images'

const TIMEOUT = 10e3 // 10s

export function doPolyfill() {
  AtpApi.xrpc.fetch = fetchHandler
}

export interface ExternalEmbedDraft {
  uri: string
  isLoading: boolean
  meta?: LinkMeta
  localThumb?: Image
}

export async function post(
  store: RootStoreModel,
  text: string,
  replyTo?: string,
  extLink?: ExternalEmbedDraft,
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

  if (!embed && extLink) {
    let thumb
    if (extLink.localThumb) {
      onStateChange?.('Uploading link thumbnail...')
      let encoding
      if (extLink.localThumb.path.endsWith('.png')) {
        encoding = 'image/png'
      } else if (
        extLink.localThumb.path.endsWith('.jpeg') ||
        extLink.localThumb.path.endsWith('.jpg')
      ) {
        encoding = 'image/jpeg'
      } else {
        store.log.warn(
          'Unexpected image format for thumbnail, skipping',
          extLink.localThumb.path,
        )
      }
      if (encoding) {
        const thumbUploadRes = await store.api.com.atproto.blob.upload(
          extLink.localThumb.path, // this will be special-cased by the fetch monkeypatch in /src/state/lib/api.ts
          {encoding},
        )
        thumb = {
          cid: thumbUploadRes.data.cid,
          mimeType: encoding,
        }
      }
    }
    embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: extLink.uri,
        title: extLink.meta?.title || '',
        description: extLink.meta?.description || '',
        thumb,
      },
    } as AppBskyEmbedExternal.Main
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
    onStateChange?.('Posting...')
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
    if (reqBody.endsWith('.jpeg') || reqBody.endsWith('.jpg')) {
      // HACK
      // React native has a bug that inflates the size of jpegs on upload
      // we get around that by renaming the file ext to .bin
      // see https://github.com/facebook/react-native/issues/27099
      // -prf
      const newPath = reqBody.replace(/\.jpe?g$/, '.bin')
      await RNFS.moveFile(reqBody, newPath)
      reqBody = newPath
    }
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
