import {Dimensions} from './types'

export function extractDataUriMime(uri: string): string {
  return uri.substring(uri.indexOf(':') + 1, uri.indexOf(';'))
}

// Fairly accurate estimate that is more performant
// than decoding and checking length of URI
export function getDataUriSize(uri: string): number {
  return Math.round((uri.length * 3) / 4)
}

export function scaleDownDimensions(
  dim: Dimensions,
  max: Dimensions,
): Dimensions {
  if (dim.width < max.width && dim.height < max.height) {
    return dim
  }
  const wScale = dim.width > max.width ? max.width / dim.width : 1
  const hScale = dim.height > max.height ? max.height / dim.height : 1
  if (wScale < hScale) {
    return {width: dim.width * wScale, height: dim.height * wScale}
  }
  return {width: dim.width * hScale, height: dim.height * hScale}
}

export function isUriImage(uri: string) {
  return /\.(jpg|jpeg|png).*$/.test(uri)
}

export function blobToDataUri(blob: Blob): Promise<string> {
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
