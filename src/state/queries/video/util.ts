import {useMemo} from 'react'
import {AtpAgent} from '@atproto/api'

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
