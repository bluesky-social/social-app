import uuid from 'react-native-uuid'
import {
  cacheDirectory,
  deleteAsync,
  makeDirectoryAsync,
  moveAsync,
} from 'expo-file-system'
import {
  Action,
  ActionCrop,
  ActionExtent,
  ActionFlip,
  ActionResize,
  ActionRotate,
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator'

import {POST_IMG_MAX} from '#/lib/constants'
import {getImageDim} from '#/lib/media/manip'
import {openCropper} from '#/lib/media/picker'
import {getDataUriSize} from '#/lib/media/util'
import {isIOS, isNative} from '#/platform/detection'

export type ImageTransformation = Partial<
  ActionCrop & ActionExtent & ActionFlip & ActionResize & ActionRotate
>

export type ImageSource = {
  path: string
  width: number
  height: number
  mime: string
}

type ComposerImageBase = {
  alt: string
  source: ImageSource
  compressed?: ImageSource
}
type ComposerImageWithoutTransformation = ComposerImageBase & {
  transformed?: undefined
}
type ComposerImageWithTransformation = ComposerImageBase & {
  transformed: ImageSource
  transformations?: ImageTransformation
}

export type ComposerImage =
  | ComposerImageWithoutTransformation
  | ComposerImageWithTransformation

const imageCacheDirectory = isNative
  ? joinPath(cacheDirectory!, 'bsky-composer')
  : null

export async function createComposerImage(
  raw: ImageSource,
): Promise<ComposerImageWithoutTransformation> {
  return {
    alt: '',
    source: {
      path: await moveIfNecessary(raw.path),
      width: raw.width,
      height: raw.height,
      mime: raw.mime,
    },
  }
}

export function createInitialImages(
  uris: {uri: string; width: number; height: number}[] | undefined,
): ComposerImageWithoutTransformation[] {
  if (uris === undefined) {
    return []
  }

  return uris.map(({uri, width, height}) => {
    return {
      alt: '',
      source: {
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

  return {
    alt: '',
    source: {
      path: uri,
      width: width,
      height: height,
      mime: 'image/jpeg',
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
  const rawActions: (Action | undefined)[] = [
    trans.extent && {extent: trans.extent},
    trans.flip && {flip: trans.flip},
    trans.rotate !== undefined ? {rotate: trans.rotate} : undefined,
    trans.resize && {resize: trans.resize},
    trans.crop && {crop: trans.crop},
  ]

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
    transformations: trans,
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

export async function compressImage(img: ComposerImage): Promise<ImageSource> {
  const source = img.transformed || img.source

  const [w, h] = containImageRes(source.width, source.height, POST_IMG_MAX)

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

    if (imageCacheDirectory) {
      await deleteAsync(res.uri)
    }
  }

  throw new Error(`Unable to compress image`)
}

async function moveIfNecessary(from: string) {
  if (cacheDirectory && from.startsWith(cacheDirectory!)) {
    const to = joinPath(imageCacheDirectory!, uuid.v4() + '')

    await makeDirectoryAsync(imageCacheDirectory!, {intermediates: true})
    await moveAsync({from, to})

    return to
  }

  return from
}

/** Purge files that were created to accomodate image manipulation */
export async function purgeTemporaryImageFiles() {
  if (imageCacheDirectory) {
    await deleteAsync(imageCacheDirectory, {idempotent: true})
    await makeDirectoryAsync(imageCacheDirectory)
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
    scale = w < h ? maxW / w : maxH / h
    w = Math.floor(w * scale)
    h = Math.floor(h * scale)
  }

  return [w, h]
}
