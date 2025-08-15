import {AtUri} from '@atproto/api'

import type * as bsky from '#/types/bsky'

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

    // This should be a string like `starterpack_haileyok.com_rkey`
    const contentParts = utmContent.split('_')

    if (contentParts[0] !== 'starterpack') return null
    if (contentParts.length !== 3) return null

    return `at://${contentParts[1]}/app.bsky.graph.starterpack/${contentParts[2]}`
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
      const [_, path, name, rkey] = parts

      if (parts.length !== 4) return null
      if (path !== 'starter-pack' && path !== 'start') return null
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
  return `https://play.google.com/store/apps/details?id=xyz.blueskyweb.app&referrer=utm_source%3Dbluesky%26utm_medium%3Dstarterpack%26utm_content%3Dstarterpack_${name}_${rkey}`
}

export function httpStarterPackUriToAtUri(httpUri?: string): string | null {
  if (!httpUri) return null

  const parsed = parseStarterPackUri(httpUri)
  if (!parsed) return null

  if (httpUri.startsWith('at://')) return httpUri

  return `at://${parsed.name}/app.bsky.graph.starterpack/${parsed.rkey}`
}

export function getStarterPackOgCard(
  didOrStarterPack: bsky.starterPack.AnyStarterPackView | string,
  rkey?: string,
) {
  if (typeof didOrStarterPack === 'string') {
    return `https://ogcard.cdn.bsky.app/start/${didOrStarterPack}/${rkey}`
  } else {
    const rkey = new AtUri(didOrStarterPack.uri).rkey
    return `https://ogcard.cdn.bsky.app/start/${didOrStarterPack.creator.did}/${rkey}`
  }
}

export function createStarterPackUri({
  did,
  rkey,
}: {
  did: string
  rkey: string
}): string {
  return new AtUri(`at://${did}/app.bsky.graph.starterpack/${rkey}`).toString()
}

export function startUriToStarterPackUri(uri: string) {
  return uri.replace('/start/', '/starter-pack/')
}
