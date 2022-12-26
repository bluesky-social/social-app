import RNFetchBlob from 'rn-fetch-blob'
import ImageResizer from '@bam.tech/react-native-image-resizer'
import {Image as PickedImage} from 'react-native-image-crop-picker'

export interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  timeout: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  let appendExt
  try {
    const urip = new URL(opts.uri)
    const ext = urip.pathname.split('.').pop()
    if (ext === 'jpg' || ext === 'jpeg') {
      appendExt = 'jpeg'
    } else if (ext === 'png') {
      appendExt = 'png'
    } else {
      return
    }
  } catch (e: any) {
    console.error('Invalid URI', opts.uri, e)
    return
  }

  let downloadRes
  try {
    const downloadResPromise = RNFetchBlob.config({
      fileCache: true,
      appendExt,
    }).fetch('GET', opts.uri)
    const to1 = setTimeout(() => downloadResPromise.cancel(), opts.timeout)
    downloadRes = await downloadResPromise
    clearTimeout(to1)

    let localUri = downloadRes.path()
    if (!localUri.startsWith('file://')) {
      localUri = `file://${localUri}`
    }

    return await resize(localUri, opts)
  } finally {
    if (downloadRes) {
      downloadRes.flush()
    }
  }
}

export interface ResizeOpts {
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
}

export async function resize(localUri: string, opts: ResizeOpts) {
  for (let i = 0; i < 9; i++) {
    const quality = 1.0 - i / 10
    const resizeRes = await ImageResizer.createResizedImage(
      localUri,
      opts.width,
      opts.height,
      'JPEG',
      quality,
      undefined,
      undefined,
      undefined,
      {mode: opts.mode},
    )
    console.log(quality, resizeRes)
    if (resizeRes.size < opts.maxSize) {
      return resizeRes
    }
  }
  throw new Error(
    `This image is too big! We couldn't compress it down to ${opts.maxSize} bytes`,
  )
}

export async function compressIfNeeded(img: PickedImage, maxSize: number) {
  const origUri = `file://${img.path}`
  if (img.size < maxSize) {
    return origUri
  }
  const resizeRez = await resize(origUri, {
    width: img.width,
    height: img.height,
    mode: 'stretch',
    maxSize,
  })
  return resizeRez.uri
}
