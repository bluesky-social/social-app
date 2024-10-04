import {AtpAgent} from '@atproto/api'

import {SupportedMimeTypes, VIDEO_SERVICE} from '#/lib/constants'

export const createVideoEndpointUrl = (
  route: string,
  params?: Record<string, string>,
) => {
  const url = new URL(VIDEO_SERVICE)
  url.pathname = route
  if (params) {
    for (const key in params) {
      url.searchParams.set(key, params[key])
    }
  }
  return url.href
}

export function createVideoAgent() {
  return new AtpAgent({
    service: VIDEO_SERVICE,
  })
}

export function mimeToExt(mimeType: SupportedMimeTypes | (string & {})) {
  switch (mimeType) {
    case 'video/mp4':
      return 'mp4'
    case 'video/webm':
      return 'webm'
    case 'video/mpeg':
      return 'mpeg'
    case 'video/quicktime':
      return 'mov'
    default:
      throw new Error(`Unsupported mime type: ${mimeType}`)
  }
}

export function extToMime(ext: string) {
  switch (ext) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'mpeg':
      return 'video/mpeg'
    case 'mov':
      return 'video/quicktime'
    default:
      throw new Error(`Unsupported file extension: ${ext}`)
  }
}
