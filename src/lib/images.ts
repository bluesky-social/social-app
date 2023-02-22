import RNFetchBlob from 'rn-fetch-blob'
import ImageResizer from '@bam.tech/react-native-image-resizer'
import {Share} from 'react-native'
import RNFS from 'react-native-fs'
import uuid from 'react-native-uuid'
import * as Toast from 'view/com/util/Toast'

export interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  timeout: number
}

export interface Image {
  path: string
  mime: string
  size: number
  width: number
  height: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  let appendExt = 'jpeg'
  try {
    const urip = new URL(opts.uri)
    const ext = urip.pathname.split('.').pop()
    if (ext === 'png') {
      appendExt = 'png'
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

export async function resize(
  localUri: string,
  opts: ResizeOpts,
): Promise<Image> {
  for (let i = 0; i < 9; i++) {
    const quality = 100 - i * 10
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
    if (resizeRes.size < opts.maxSize) {
      return {
        path: resizeRes.path,
        mime: 'image/jpeg',
        size: resizeRes.size,
        width: resizeRes.width,
        height: resizeRes.height,
      }
    }
  }
  throw new Error(
    `This image is too big! We couldn't compress it down to ${opts.maxSize} bytes`,
  )
}

export async function compressIfNeeded(
  img: Image,
  maxSize: number,
): Promise<Image> {
  const origUri = `file://${img.path}`
  if (img.size < maxSize) {
    return img
  }
  const resizedImage = await resize(origUri, {
    width: img.width,
    height: img.height,
    mode: 'stretch',
    maxSize,
  })
  const finalImageMovedPath = await moveToPremanantPath(resizedImage.path)
  const finalImg = {
    ...resizedImage,
    path: finalImageMovedPath,
  }
  return finalImg
}

export interface Dim {
  width: number
  height: number
}
export function scaleDownDimensions(dim: Dim, max: Dim): Dim {
  if (dim.width < max.width && dim.height < max.height) {
    return dim
  }
  let wScale = dim.width > max.width ? max.width / dim.width : 1
  let hScale = dim.height > max.height ? max.height / dim.height : 1
  if (wScale < hScale) {
    return {width: dim.width * wScale, height: dim.height * wScale}
  }
  return {width: dim.width * hScale, height: dim.height * hScale}
}

export const saveImageModal = async ({uri}: {uri: string}) => {
  const downloadResponse = await RNFetchBlob.config({
    fileCache: true,
  }).fetch('GET', uri)

  const imagePath = downloadResponse.path()
  const base64Data = await downloadResponse.readFile('base64')
  const result = await Share.share({
    url: 'data:image/png;base64,' + base64Data,
  })
  if (result.action === Share.sharedAction) {
    Toast.show('Image saved to gallery')
  } else if (result.action === Share.dismissedAction) {
    // dismissed
  }
  RNFS.unlink(imagePath)
}

export const moveToPremanantPath = async (path: string) => {
  /*
  Since this package stores images in a temp directory, we need to move the file to a permanent location.
  Relevant: IOS bug when trying to open a second time:
  https://github.com/ivpusic/react-native-image-crop-picker/issues/1199
  */
  const filename = uuid.v4()
  const destinationPath = `${RNFS.TemporaryDirectoryPath}/${filename}`
  RNFS.moveFile(path, destinationPath)
  return destinationPath
}
