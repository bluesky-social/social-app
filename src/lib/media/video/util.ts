import {Client} from '@atproto/lex'

import {type SupportedMimeTypes, VIDEO_SERVICE} from '#/lib/constants'

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

/**
 * A non-refreshing throwaway lex {@link Client} scoped to the video service,
 * authenticated by a per-call service-auth token. It has no session, so nothing
 * can refresh it: requests go straight to the video service with the token as a
 * static Authorization header (a raw client, unlike a session, is allowed to
 * preset that header). Mirrors the scoped-client pattern in
 * `#/ageAssurance/useBeginAgeAssurance`.
 */
export function createVideoServiceClient(token: string) {
  return new Client({
    service: VIDEO_SERVICE,
    headers: {authorization: `Bearer ${token}`},
  })
}

/**
 * An unauthenticated lex {@link Client} scoped to the video service, used for
 * public reads like `getJobStatus` polling. Mirrors the old unauthenticated
 * `AtpAgent` at `VIDEO_SERVICE`.
 */
export function createTokenlessVideoServiceClient() {
  return new Client({
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
    case 'image/gif':
      return 'gif'
    default:
      throw new Error(`Unsupported mime type: ${mimeType}`)
  }
}

export function extToMime(ext: string) {
  switch (ext.toLowerCase()) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'mpeg':
      return 'video/mpeg'
    case 'mov':
      return 'video/quicktime'
    case 'gif':
      return 'image/gif'
    default:
      throw new Error(`Unsupported file extension: ${ext}`)
  }
}
