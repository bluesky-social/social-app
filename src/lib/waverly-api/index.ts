import {ExternalEmbedDraft} from 'lib/api'
import {isNetworkError} from 'lib/strings/errors'
import {RootStoreModel} from 'state/index'
import {ImageModel} from 'state/models/media/image'
import {WExtLinkInput, WLinkMetaInput} from 'state/models/waverly-agent/types'

interface PostOpts {
  rawText: string
  groupDid: string
  extLink?: ExternalEmbedDraft
  image?: ImageModel
  onStateChange?: (state: string) => void
  // langs?: string[] TODO:POST do we need this?
}

export async function post(store: RootStoreModel, opts: PostOpts) {
  opts.onStateChange?.('Processing...')

  let imageData
  if (opts.image) {
    opts.onStateChange?.('Processing image')
    await opts.image.compress()
    const b64 = opts.image.compressed?.data
    if (!b64) store.log.error('Could not find base64 string')
    imageData = {
      b64Image: b64 ?? '',
      alt: opts.image.altText,
    }
  }

  let extLinkData: WExtLinkInput | undefined
  if (opts.extLink) {
    await opts.extLink.localThumb?.compress()
    const b64 = opts.extLink.localThumb?.compressed?.data
    const meta = opts.extLink.meta
    const metaInput: WLinkMetaInput | undefined = meta
      ? {
          url: meta.url,
          title: meta.title,
          description: meta.description,
          image: meta.image,
          b64Image: b64 ?? '',
        }
      : undefined
    extLinkData = {uri: opts.extLink.uri, meta: metaInput}
  }

  try {
    opts.onStateChange?.('Posting...')
    return await store.waverlyAgent.api.postMiniBlog({
      input: {
        groupDid: opts.groupDid,
        longText: opts.rawText,
        imageData,
        extLinkData,
      },
    })
  } catch (e: any) {
    store.log.error(`Failed to create waverly post: ${e.toString()}`)
    if (isNetworkError(e)) {
      throw new Error(
        'Post failed to upload. Please check your Internet connection and try again.',
      )
    } else {
      throw e
    }
  }
}
