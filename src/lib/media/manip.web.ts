import uuid from 'react-native-uuid'
import RNFS from 'react-native-fs'
import {Dimensions, Image} from './types'
import {extractDataUriMime, getDataUriSize} from './util'

export interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  timeout: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), opts.timeout || 5e3)
  const res = await fetch(opts.uri)
  const resBody = await res.blob()
  clearTimeout(to)

  const dataUri = await blobToDataUri(resBody)
  return await resize(dataUri, opts)
}

export interface ResizeOpts {
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
}

export async function resize(
  dataUri: string,
  _opts: ResizeOpts,
): Promise<Image> {
  const dim = await getImageDim(dataUri)
  // TODO -- need to resize
  return {
    mediaType: 'photo',
    path: dataUri,
    mime: extractDataUriMime(dataUri),
    size: getDataUriSize(dataUri),
    width: dim.width,
    height: dim.height,
  }
}

export async function moveToPermanentPath(path: string) {
  return path
}

export async function compressIfNeeded(
  img: Image,
  maxSize: number, // OLLIE TODO - Find value
): Promise<Image> {
  if (img.size > maxSize) {
    // TODO
    throw new Error(
      "This image is too large and we haven't implemented compression yet -- sorry!",
    )
  }
  return img
}

export async function saveImageModal(_opts: {uri: string}) {
  // TODO
  throw new Error('TODO')
}

export async function getImageDim(path: string): Promise<Dimensions> {
  var img = document.createElement('img')
  const promise = new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })
  img.src = path
  await promise
  return {width: img.width, height: img.height}
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read blob'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
