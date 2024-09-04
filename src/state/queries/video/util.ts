import {useMemo} from 'react'
import {AtpAgent} from '@atproto/api'

import {SupportedMimeTypes} from '#/lib/constants'

const UPLOAD_ENDPOINT = 'https://video.bsky.app/'

export const createVideoEndpointUrl = (
  route: string,
  params?: Record<string, string>,
) => {
  const url = new URL(`${UPLOAD_ENDPOINT}`)
  url.pathname = route
  if (params) {
    for (const key in params) {
      url.searchParams.set(key, params[key])
    }
  }
  return url.href
}

export function useVideoAgent() {
  return useMemo(() => {
    return new AtpAgent({
      service: UPLOAD_ENDPOINT,
    })
  }, [])
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
