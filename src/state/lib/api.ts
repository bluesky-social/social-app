/**
 * The environment is a place where services and shared dependencies between
 * models live. They are made available to every model via dependency injection.
 */

// import {ReactNativeStore} from './auth'
import {AppBskyEmbedImages, AppBskyEmbedExternal} from '@atproto/api'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from '../models/root-store'
import {extractEntities} from '../../lib/strings'
import {isNetworkError} from '../../lib/errors'
import {LinkMeta} from '../../lib/link-meta'
import {Image} from '../../lib/images'

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
