import RNFetchBlob from 'rn-fetch-blob'
import ImageResizer from '@bam.tech/react-native-image-resizer'

interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
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

    const resizeRes = await ImageResizer.createResizedImage(
      localUri,
      opts.width,
      opts.height,
      'JPEG',
      0.7,
      undefined,
      undefined,
      undefined,
      {mode: opts.mode},
    )
    return resizeRes
  } finally {
    if (downloadRes) {
      downloadRes.flush()
    }
  }
}
