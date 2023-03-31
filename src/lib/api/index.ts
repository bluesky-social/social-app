import {
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  ComAtprotoRepoUploadBlob,
  RichText,
} from '@atproto/api'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from 'state/models/root-store'
import {isNetworkError} from 'lib/strings/errors'
import {LinkMeta} from '../link-meta/link-meta'
import {Image} from '../media/manip'
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
  const res = await store.agent.resolveHandle({
    handle: didOrHandle,
  })
  return res.data.did
}

export async function uploadBlob(
  store: RootStoreModel,
  blob: string,
  encoding: string,
): Promise<ComAtprotoRepoUploadBlob.Response> {
  if (isWeb) {
    // `blob` should be a data uri
    return store.agent.uploadBlob(convertDataURIToUint8Array(blob), {
      encoding,
    })
  } else {
    // `blob` should be a path to a file in the local FS
    return store.agent.uploadBlob(
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
    | AppBskyEmbedRecordWithMedia.Main
    | undefined
  let reply
  const rt = new RichText(
    {text: opts.rawText.trim()},
    {
      cleanNewlines: true,
    },
  )

  opts.onStateChange?.('Processing...')
  await rt.detectFacets(store.agent)

  if (opts.quote) {
    embed = {
      $type: 'app.bsky.embed.record',
      record: {
        uri: opts.quote.uri,
        cid: opts.quote.cid,
      },
    } as AppBskyEmbedRecord.Main
  }

  if (opts.images?.length) {
    const images: AppBskyEmbedImages.Image[] = []
    for (const image of opts.images) {
      opts.onStateChange?.(`Uploading image #${images.length + 1}...`)
      const res = await uploadBlob(store, image, 'image/jpeg')
      images.push({
        image: res.data.blob,
        alt: '', // TODO supply alt text
      })
    }

    if (opts.quote) {
      embed = {
        $type: 'app.bsky.embed.recordWithMedia',
        record: embed,
        media: {
          $type: 'app.bsky.embed.images',
          images,
        },
      } as AppBskyEmbedRecordWithMedia.Main
    } else {
      embed = {
        $type: 'app.bsky.embed.images',
        images,
      } as AppBskyEmbedImages.Main
    }
  }

  if (opts.extLink && !opts.images?.length) {
    let thumb
    if (opts.extLink.localThumb) {
      opts.onStateChange?.('Uploading link thumbnail...')
      let encoding
      if (opts.extLink.localThumb.mime) {
        encoding = opts.extLink.localThumb.mime
      } else if (opts.extLink.localThumb.path.endsWith('.png')) {
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
        thumb = thumbUploadRes.data.blob
      }
    }

    if (opts.quote) {
      embed = {
        $type: 'app.bsky.embed.recordWithMedia',
        record: embed,
        media: {
          $type: 'app.bsky.embed.external',
          external: {
            uri: opts.extLink.uri,
            title: opts.extLink.meta?.title || '',
            description: opts.extLink.meta?.description || '',
            thumb,
          },
        } as AppBskyEmbedExternal.Main,
      } as AppBskyEmbedRecordWithMedia.Main
    } else {
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
  }

  if (opts.replyTo) {
    const replyToUrip = new AtUri(opts.replyTo)
    const parentPost = await store.agent.getPost({
      repo: replyToUrip.host,
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
    return await store.agent.post({
      text: rt.text,
      facets: rt.facets,
      reply,
      embed,
    })
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
