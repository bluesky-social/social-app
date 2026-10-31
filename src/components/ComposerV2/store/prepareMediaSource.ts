import {type ImagePickerAsset} from 'expo-image-picker'

import {extractDataUriMime} from '#/lib/media/util'
import {extToMime} from '#/lib/media/video/util'
import {IS_WEB} from '#/env'
import {
  type PostMediaImage,
  type PostMediaVideo,
  type ResolvedSourceMetadata,
} from './types'
import {validDimensions} from './utils/validDimensions'
import {ValidationError} from './validationError'

/*
 * Media source preparation for the upload workers. Known item metadata is used
 * first, then cheap sources (a web File's type and size, a data URI's MIME
 * type, a file extension, a native file stat), and a metadata helper runs only
 * for values that are still missing. Each result includes the prepared
 * metadata so the store can retain it for retries of the same item.
 */

type GetImageDimensions = (
  uri: string,
) => Promise<{width: number; height: number}>

/**
 * What the worker reads from a video metadata probe. Deliberately omits the
 * probed asset's `uri` and `file`: the production adapter owns and releases
 * any URL the shared helper created (see `createScalarVideoMetadata`).
 */
export type ProbedVideoMetadata = {
  width: number
  height: number
  mimeType?: string | null
  /** Milliseconds. */
  duration?: number | null
  fileSize?: number
}

export type GetVideoMetadata = (
  file: File | string,
  fallbackMimeType?: string,
) => Promise<ProbedVideoMetadata>

/**
 * The web image loader rejects with an `Event` when the bytes cannot be
 * decoded. Native `Image.getSize` rejects when the file cannot be read, but
 * resolves 0x0 for undecodable bytes, which the dimension checks reject
 * instead. Either way a rejection means the source is unreadable, so retrying
 * would fail the same way.
 */
async function readDimensions({
  uri,
  getImageDimensions,
}: {
  uri: string
  getImageDimensions: GetImageDimensions
}) {
  try {
    return await getImageDimensions(uri)
  } catch {
    throw new ValidationError('unreadable-media')
  }
}

/** Resolve image dimensions and MIME type without re-reading known values. */
export async function prepareImageSource({
  media,
  getImageDimensions,
}: {
  media: PostMediaImage
  getImageDimensions: GetImageDimensions
}): Promise<{
  source: {uri: string; width: number; height: number; mimeType?: string}
  metadata: ResolvedSourceMetadata
}> {
  const mimeType = media.mimeType ?? dataUriMimeType({uri: media.uri})
  let dimensions = validDimensions(media)
    ? {width: media.width, height: media.height}
    : undefined
  if (!dimensions)
    dimensions = await readDimensions({uri: media.uri, getImageDimensions})
  return {
    source: {uri: media.uri, ...dimensions, mimeType},
    metadata: {...dimensions, mimeType},
  }
}

/**
 * Build the asset the shared video compressor expects. GIFs never reach the
 * video metadata probe: on iOS it never settles for a file without a video
 * track. Their dimensions come from the image loader and, on native, their size
 * from a file stat, so the compressor's GIF pass-through gets a real size.
 */
export async function prepareVideoSource({
  media,
  getVideoMetadata,
  getImageDimensions,
  getFileSize,
}: {
  media: PostMediaVideo
  getVideoMetadata: GetVideoMetadata
  getImageDimensions: GetImageDimensions
  getFileSize: (uri: string) => Promise<number>
}): Promise<{asset: ImagePickerAsset; metadata: ResolvedSourceMetadata}> {
  let file = media.file
    ? toFile({blob: media.file, type: media.mimeType})
    : undefined
  let mimeType =
    media.mimeType ??
    (file?.type || undefined) ??
    dataUriMimeType({uri: media.uri}) ??
    extensionMimeType({uri: media.uri})
  let dimensions = validDimensions(media)
    ? {width: media.width, height: media.height}
    : undefined
  let duration = media.duration
  let fileSize = media.fileSize ?? file?.size

  const needsProbe = () =>
    mimeType !== 'image/gif' && (!mimeType || !dimensions || duration == null)

  /*
   * The web metadata helper and compressor read a File. Fetch one only when a
   * URI-only source is missing its type or needs probing; the compressor
   * would otherwise fetch the same URI itself.
   */
  if (IS_WEB && !file && (!mimeType || needsProbe())) {
    const blob = await fetch(media.uri).then(response => response.blob())
    file = toFile({blob, type: mimeType})
    mimeType ??= file.type || undefined
    fileSize ??= file.size
  }

  if (mimeType === 'image/gif') {
    dimensions ??= await readDimensions({uri: media.uri, getImageDimensions})
    if (!IS_WEB && fileSize == null) fileSize = await getFileSize(media.uri)
  } else if (needsProbe()) {
    const probed = IS_WEB
      ? await getVideoMetadata(file!, mimeType)
      : await getVideoMetadata(media.uri, mimeType)
    mimeType ??= probed.mimeType ?? undefined
    if (!dimensions && validDimensions(probed)) {
      dimensions = {width: probed.width, height: probed.height}
    }
    duration ??= probed.duration ?? undefined
    fileSize ??= probed.fileSize
  } else if (!IS_WEB && fileSize == null) {
    /*
     * Lets the compressor pass small acceptable files through untouched. It is
     * only an optimization for video: without a size the compressor transcodes.
     */
    fileSize = await getFileSize(media.uri).catch(() => undefined)
  }

  return {
    asset: {
      uri: media.uri,
      file,
      mimeType,
      width: dimensions?.width ?? 0,
      height: dimensions?.height ?? 0,
      duration,
      fileSize,
    },
    metadata: {...dimensions, mimeType, duration, fileSize},
  }
}

function dataUriMimeType({uri}: {uri: string}) {
  if (!uri.startsWith('data:')) return undefined
  return extractDataUriMime(uri) || undefined
}

/** The video extensions the upload path already recognizes, including GIF. */
function extensionMimeType({uri}: {uri: string}) {
  if (uri.startsWith('data:') || uri.startsWith('blob:')) return undefined
  const extension = uri.match(/\.([^.?#/]+)(?:[?#]|$)/)?.[1]
  if (!extension) return undefined
  try {
    return extToMime(extension)
  } catch {
    return undefined
  }
}

/** The web metadata helper needs a File; wrapping a Blob does not copy bytes. */
function toFile({blob, type}: {blob: Blob; type?: string}): File {
  if (typeof File !== 'undefined' && blob instanceof File) return blob
  return new File([blob], 'video', {type: blob.type || type})
}
