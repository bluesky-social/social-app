import {
  cacheDirectory,
  deleteAsync,
  makeDirectoryAsync,
  moveAsync,
} from 'expo-file-system'
import {
  Action,
  ActionCrop,
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator'
import {nanoid} from 'nanoid/non-secure'

import {POST_IMG_MAX} from '#/lib/constants'
import {getImageDim} from '#/lib/media/manip'
import {openCropper} from '#/lib/media/picker'
import {getDataUriSize} from '#/lib/media/util'
import {isIOS, isNative} from '#/platform/detection'

export type ImageTransformation = {
  crop?: ActionCrop['crop']
}

export type ImageMeta = {
  path: string
  width: number
  height: number
  mime: string
}

export type ImageSource = ImageMeta & {
  id: string
}

type ComposerImageBase = {
  alt: string
  source: ImageSource
}
type ComposerImageWithoutTransformation = ComposerImageBase & {
  transformed?: undefined
  manips?: undefined
}
type ComposerImageWithTransformation = ComposerImageBase & {
  transformed: ImageMeta
  manips?: ImageTransformation
}

export type ComposerImage =
  | ComposerImageWithoutTransformation
  | ComposerImageWithTransformation

let _imageCacheDirectory: string

function getImageCacheDirectory(): string | null {
  if (isNative) {
    return (_imageCacheDirectory ??= joinPath(cacheDirectory!, 'bsky-composer'))
  }

  return null
}

export async function createComposerImage(
  raw: ImageMeta,
): Promise<ComposerImageWithoutTransformation> {
  return {
    alt: '',
    source: {
      id: nanoid(),
      path: await moveIfNecessary(raw.path),
      width: raw.width,
      height: raw.height,
      mime: raw.mime,
    },
  }
}

export type InitialImage = {
  uri: string
  width: number
  height: number
  altText?: string
}

export function createInitialImages(
  uris: InitialImage[] = [],
): ComposerImageWithoutTransformation[] {
  return uris.map(({uri, width, height, altText = ''}) => {
    return {
      alt: altText,
      source: {
        id: nanoid(),
        path: uri,
        width: width,
        height: height,
        mime: 'image/jpeg',
      },
    }
  })
}

export async function pasteImage(
  uri: string,
): Promise<ComposerImageWithoutTransformation> {
  const {width, height} = await getImageDim(uri)
  const match = /^data:(.+?);/.exec(uri)

  return {
    alt: '',
    source: {
      id: nanoid(),
      path: uri,
      width: width,
      height: height,
      mime: match ? match[1] : 'image/jpeg',
    },
  }
}

export async function cropImage(img: ComposerImage): Promise<ComposerImage> {
  if (!isNative) {
    return img
  }

  // NOTE
  // on ios, react-native-image-crop-picker gives really bad quality
  // without specifying width and height. on android, however, the
  // crop stretches incorrectly if you do specify it. these are
  // both separate bugs in the library. we deal with that by
  // providing width & height for ios only
  // -prf

  const source = img.source
  const [w, h] = containImageRes(source.width, source.height, POST_IMG_MAX)

  // @todo: we're always passing the original image here, does image-cropper
  // allows for setting initial crop dimensions? -mary
  try {
    const cropped = await openCropper({
      mediaType: 'photo',
      path: source.path,
      freeStyleCropEnabled: true,
      ...(isIOS ? {width: w, height: h} : {}),
    })

    return {
      alt: img.alt,
      source: source,
      transformed: {
        path: await moveIfNecessary(cropped.path),
        width: cropped.width,
        height: cropped.height,
        mime: cropped.mime,
      },
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('User cancelled')) {
      return img
    }

    throw e
  }
}

export async function manipulateImage(
  img: ComposerImage,
  trans: ImageTransformation,
): Promise<ComposerImage> {
  const rawActions: (Action | undefined)[] = [trans.crop && {crop: trans.crop}]

  const actions = rawActions.filter((a): a is Action => a !== undefined)

  if (actions.length === 0) {
    if (img.transformed === undefined) {
      return img
    }

    return {alt: img.alt, source: img.source}
  }

  const source = img.source
  const result = await manipulateAsync(source.path, actions, {
    format: SaveFormat.PNG,
  })

  return {
    alt: img.alt,
    source: img.source,
    transformed: {
      path: await moveIfNecessary(result.uri),
      width: result.width,
      height: result.height,
      mime: 'image/png',
    },
    manips: trans,
  }
}

export function resetImageManipulation(
  img: ComposerImage,
): ComposerImageWithoutTransformation {
  if (img.transformed !== undefined) {
    return {alt: img.alt, source: img.source}
  }

  return img
}

export async function compressImage(img: ComposerImage): Promise<ImageMeta> {
  const source = img.transformed || img.source

  const [w, h] = containImageRes(source.width, source.height, POST_IMG_MAX)
  const cacheDir = isNative && getImageCacheDirectory()

  for (let i = 10; i > 0; i--) {
    // Float precision
    const factor = i / 10

    const res = await manipulateAsync(
      source.path,
      [{resize: {width: w, height: h}}],
      {
        compress: factor,
        format: SaveFormat.JPEG,
        base64: true,
      },
    )

    const base64 = res.base64

    if (base64 !== undefined && getDataUriSize(base64) <= POST_IMG_MAX.size) {
      return {
        path: await moveIfNecessary(res.uri),
        width: res.width,
        height: res.height,
        mime: 'image/jpeg',
      }
    }

    if (cacheDir) {
      await deleteAsync(res.uri)
    }
  }

  throw new Error(`Unable to compress image`)
}

async function moveIfNecessary(from: string) {
  const cacheDir = isNative && getImageCacheDirectory()

  if (cacheDir && !from.startsWith('data:') && !from.startsWith(cacheDir)) {
    const to = joinPath(cacheDir, nanoid(36))

    await makeDirectoryAsync(cacheDir, {intermediates: true})
    await moveAsync({from, to})

    return to
  }

  return from
}

/** Purge files that were created to accomodate image manipulation */
export async function purgeTemporaryImageFiles() {
  const cacheDir = isNative && getImageCacheDirectory()

  if (cacheDir) {
    await deleteAsync(cacheDir, {idempotent: true})
    await makeDirectoryAsync(cacheDir)
  }
}

function joinPath(a: string, b: string) {
  if (a.endsWith('/')) {
    if (b.startsWith('/')) {
      return a.slice(0, -1) + b
    }
    return a + b
  } else if (b.startsWith('/')) {
    return a + b
  }
  return a + '/' + b
}

function containImageRes(
  w: number,
  h: number,
  {width: maxW, height: maxH}: {width: number; height: number},
): [width: number, height: number] {
  let scale = 1

  if (w > maxW || h > maxH) {
    scale = w > h ? maxW / w : maxH / h
    w = Math.floor(w * scale)
    h = Math.floor(h * scale)
  }

  return [w, h]
}
