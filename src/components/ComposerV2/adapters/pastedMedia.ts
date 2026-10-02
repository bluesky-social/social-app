import {extractDataUriMime} from '#/lib/media/util'
import {type AddMediaInput} from '#/components/ComposerV2/store/types'
import {IS_WEB} from '#/env'

/**
 * Convert one pasted or dropped source into an `addMedia` input, without
 * reading it. Accepts the payloads the existing text inputs emit: native
 * pasted file URIs, and web data URIs (web paste and drop already convert
 * files to data URIs). Upload workers resolve any missing metadata later.
 *
 * Classification follows the existing composer: videos use the video
 * pipeline, as do GIF files on web (a GIF file is not a provider GIF card).
 * Native treats a pasted GIF as a still image, and data URI video is rejected
 * on native. Returns undefined for content V2 cannot attach. Pass every pasted
 * item to one `addMedia` call so the usual selection limits apply.
 */
export function pastedMediaToInput({
  source,
}: {
  /** A native file URI, or a web data/object URL. */
  source: string
}): AddMediaInput | undefined {
  if (source.startsWith('data:')) {
    const mimeType = extractDataUriMime(source) || undefined
    const kind = classify({mimeType})
    /* Only web can read a data URI video, as in the existing composer. */
    if (!kind || (kind === 'video' && !IS_WEB)) return undefined
    return {kind, uri: source, mimeType}
  }

  /*
   * Other URIs carry no type: native pasted images arrive as temporary file
   * URIs already filtered to image extensions by the text input, and a web
   * object URL is treated the same way. The worker resolves the metadata.
   */
  return {kind: 'image', uri: source}
}

function classify({
  mimeType,
}: {
  mimeType: string | undefined
}): 'image' | 'video' | undefined {
  if (!mimeType) return undefined
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'image/gif') return IS_WEB ? 'video' : 'image'
  if (mimeType.startsWith('image/')) return 'image'
  return undefined
}
