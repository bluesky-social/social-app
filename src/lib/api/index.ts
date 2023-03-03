import {
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
  ComAtprotoBlobUpload,
  AppBskyEmbedRecord,
} from '@atproto/api'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from 'state/models/root-store'
import {extractEntities} from 'lib/strings/rich-text-detection'
import {isNetworkError} from 'lib/strings/errors'
import {LinkMeta} from '../link-meta/link-meta'
import {Image} from '../media/manip'
import {RichText} from '../strings/rich-text'
import {isWeb} from 'platform/detection'

export interface ExternalEmbedDraft {
  uri: string
  isLoading: boolean
  meta?: LinkMeta
  localThumb?: Image
}

export async function resolveName(store: RootStoreModel, didOrHandle: string) {
  if (!didOrHandle) {
    throw new Error('Invalid handle: ""')
  }
  if (didOrHandle.startsWith('did:')) {
    return didOrHandle
  }
  const res = await store.api.com.atproto.handle.resolve({
    handle: didOrHandle,
  })
  return res.data.did
}

export async function uploadBlob(
  store: RootStoreModel,
  blob: string,
  encoding: string,
): Promise<ComAtprotoBlobUpload.Response> {
  if (isWeb) {
    // `blob` should be a data uri
    return store.api.com.atproto.blob.upload(convertDataURIToUint8Array(blob), {
      encoding,
    })
  } else {
    // `blob` should be a path to a file in the local FS
    return store.api.com.atproto.blob.upload(
      blob, // this will be special-cased by the fetch monkeypatch in /src/state/lib/api.ts
      {encoding},
    )
  }
}

interface PostOpts {
  rawText: string
  replyTo?: string
  quote?: {
    uri: string
    cid: string
  }
  extLink?: ExternalEmbedDraft
  images?: string[]
  knownHandles?: Set<string>
  onStateChange?: (state: string) => void
}

export async function post(store: RootStoreModel, opts: PostOpts) {
  let embed:
    | AppBskyEmbedImages.Main
    | AppBskyEmbedExternal.Main
    | AppBskyEmbedRecord.Main
    | undefined
  let reply
  const text = new RichText(opts.rawText, undefined, {
    cleanNewlines: true,
  }).text.trim()

  opts.onStateChange?.('Processing...')
  const entities = extractEntities(text, opts.knownHandles)
  if (entities) {
    for (const ent of entities) {
      if (ent.type === 'mention') {
        const prof = await store.profiles.getProfile(ent.value)
        ent.value = prof.data.did
      }
    }
  }

  if (opts.quote) {
    embed = {
      $type: 'app.bsky.embed.record',
      record: {
        uri: opts.quote.uri,
        cid: opts.quote.cid,
      },
    } as AppBskyEmbedRecord.Main
  } else if (opts.images?.length) {
    embed = {
      $type: 'app.bsky.embed.images',
      images: [],
    } as AppBskyEmbedImages.Main
    let i = 1
    for (const image of opts.images) {
      opts.onStateChange?.(`Uploading image #${i++}...`)
      const res = await uploadBlob(store, image, 'image/jpeg')
      embed.images.push({
        image: {
          cid: res.data.cid,
          mimeType: 'image/jpeg',
        },
        alt: '', // TODO supply alt text
      })
    }
  } else if (opts.extLink) {
    let thumb
    if (opts.extLink.localThumb) {
      opts.onStateChange?.('Uploading link thumbnail...')
      let encoding
      if (opts.extLink.localThumb.path.endsWith('.png')) {
        encoding = 'image/png'
      } else if (
        opts.extLink.localThumb.path.endsWith('.jpeg') ||
        opts.extLink.localThumb.path.endsWith('.jpg')
      ) {
        encoding = 'image/jpeg'
      } else {
        store.log.warn(
          'Unexpected image format for thumbnail, skipping',
          opts.extLink.localThumb.path,
        )
      }
      if (encoding) {
        const thumbUploadRes = await uploadBlob(
          store,
          opts.extLink.localThumb.path,
          encoding,
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
        uri: opts.extLink.uri,
        title: opts.extLink.meta?.title || '',
        description: opts.extLink.meta?.description || '',
        thumb,
      },
    } as AppBskyEmbedExternal.Main
  }

  if (opts.replyTo) {
    const replyToUrip = new AtUri(opts.replyTo)
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
    opts.onStateChange?.('Posting...')
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

// helpers
// =

function convertDataURIToUint8Array(uri: string): Uint8Array {
  var raw = window.atob(uri.substring(uri.indexOf(';base64,') + 8))
  var binary = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) {
    binary[i] = raw.charCodeAt(i)
  }
  return binary
}
