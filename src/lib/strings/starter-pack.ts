import {AtUri} from '@atproto/api'

import {makeStarterPackLink} from 'lib/routes/links'

export function createStarterPackLinkFromAndroidReferrer(
  referrerQueryString: string,
): string | null {
  try {
    // The referrer string is just some URL parameters, so lets add them to a fake URL
    const url = new URL('http://throwaway.com/?' + referrerQueryString)
    const utmContent = url.searchParams.get('utm_content')
    const utmSource = url.searchParams.get('utm_source')

    if (!utmContent) return null
    if (utmSource !== 'bluesky') return null

    // This should be a string like `starterpack-haileyok.com-rkey`
    const contentParts = utmContent.split('-')

    if (contentParts[0] !== 'starterpack') return null
    if (contentParts.length !== 3) return null

    return makeStarterPackLink(contentParts[1], contentParts[2])
  } catch (e) {
    return null
  }
}

export function parseStarterPackUri(uri?: string): {
  name: string
  rkey: string
} | null {
  if (!uri) return null

  try {
    if (uri.startsWith('at://')) {
      const atUri = new AtUri(uri)
      if (atUri.collection !== 'app.bsky.graph.starterpack') return null
      if (atUri.rkey) {
        return {
          name: atUri.hostname,
          rkey: atUri.rkey,
        }
      }
      return null
    } else {
      const url = new URL(uri)
      const parts = url.pathname.split('/')
      const name = parts[2]
      const rkey = parts[3]

      if (parts.length !== 4) return null
      if (!name || !rkey) return null
      return {
        name,
        rkey,
      }
    }
  } catch (e) {
    return null
  }
}

export function createStarterPackGooglePlayUri(
  name: string,
  rkey: string,
): string | null {
  if (!name || !rkey) return null
  return `https://play.google.com/store/apps/details?id=xyz.blueskyweb.app&referrer=utm_source%3Dbluesky%26utm_medium%3Dstarterpack%26utm_content%3Dstarterpack-${name}-${rkey}`
}
