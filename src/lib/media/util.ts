export function extractDataUriMime(uri: string): string {
  return uri.substring(uri.indexOf(':') + 1, uri.indexOf(';'))
}

// Fairly accurate estimate that is more performant
// than decoding and checking length of URI
export function getDataUriSize(uri: string): number {
  return Math.round((uri.length * 3) / 4)
}

export function isUriImage(uri: string): boolean {
  return /\.(jpg|jpeg|png|webp).*$/.test(uri)
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

export type ImgproxyPreset =
  | 'default'
  | 'avatar_thumbnail'
  | 'avatar'
  | 'banner'
  | 'feed_fullsize'
  | 'feed_thumbnail'
  | 'download'

const IMGPROXY_PRESET_RE =
  /(?<=\/img\/)(default|avatar_thumbnail|avatar|banner|feed_fullsize|feed_thumbnail|download)(?=\/)/

/**
 * Replaces any imgproxy preset in a CDN URI with the given preset.
 */
export function convertCdnPreset(uri: string, preset: ImgproxyPreset): string {
  return uri.replace(IMGPROXY_PRESET_RE, preset)
}
