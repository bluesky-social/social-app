import {AtUri} from '@atproto/api'
import {PROD_SERVICE} from 'state/index'
import TLDs from 'tlds'

export function isValidDomain(str: string): boolean {
  return !!TLDs.find(tld => {
    let i = str.lastIndexOf(tld)
    if (i === -1) {
      return false
    }
    return str.charAt(i - 1) === '.' && i === str.length - tld.length
  })
}

export function makeRecordUri(
  didOrName: string,
  collection: string,
  rkey: string,
) {
  const urip = new AtUri('at://host/')
  urip.host = didOrName
  urip.collection = collection
  urip.rkey = rkey
  return urip.toString()
}

export function toNiceDomain(url: string): string {
  try {
    const urlp = new URL(url)
    if (`https://${urlp.host}` === PROD_SERVICE) {
      return 'Bluesky Social'
    }
    return urlp.host ? urlp.host : url
  } catch (e) {
    return url
  }
}

export function toShortUrl(url: string): string {
  try {
    const urlp = new URL(url)
    if (urlp.protocol !== 'http:' && urlp.protocol !== 'https:') {
      return url
    }
    const path =
      (urlp.pathname === '/' ? '' : urlp.pathname) + urlp.search + urlp.hash
    if (path.length > 15) {
      return urlp.host + path.slice(0, 13) + '...'
    }
    return urlp.host + path
  } catch (e) {
    return url
  }
}

export function toShareUrl(url: string): string {
  if (!url.startsWith('https')) {
    const urlp = new URL('https://bsky.app')
    urlp.pathname = url
    url = urlp.toString()
  }
  return url
}

export function isBskyAppUrl(url: string): boolean {
  return url.startsWith('https://bsky.app/')
}

export function isExternalUrl(url: string): boolean {
  return !isBskyAppUrl(url) && url.startsWith('http')
}

export function isBskyPostUrl(url: string): boolean {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return /profile\/(?<name>[^/]+)\/post\/(?<rkey>[^/]+)/i.test(
        urlp.pathname,
      )
    } catch {}
  }
  return false
}

export function isBskyCustomFeedUrl(url: string): boolean {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return /profile\/(?<name>[^/]+)\/feed\/(?<rkey>[^/]+)/i.test(
        urlp.pathname,
      )
    } catch {}
  }
  return false
}

export function isBskyListUrl(url: string): boolean {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return /profile\/(?<name>[^/]+)\/lists\/(?<rkey>[^/]+)/i.test(
        urlp.pathname,
      )
    } catch {
      console.error('Unexpected error in isBskyListUrl()', url)
    }
  }
  return false
}

export function convertBskyAppUrlIfNeeded(url: string): string {
  if (isBskyAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return urlp.pathname
    } catch (e) {
      console.error('Unexpected error in convertBskyAppUrlIfNeeded()', e)
    }
  }
  return url
}

export function listUriToHref(url: string): string {
  try {
    const {hostname, rkey} = new AtUri(url)
    return `/profile/${hostname}/lists/${rkey}`
  } catch {
    return ''
  }
}

export function feedUriToHref(url: string): string {
  try {
    const {hostname, rkey} = new AtUri(url)
    return `/profile/${hostname}/feed/${rkey}`
  } catch {
    return ''
  }
}

export function getYoutubeVideoId(link: string): string | undefined {
  let url
  try {
    url = new URL(link)
  } catch (e) {
    return undefined
  }

  if (
    url.hostname !== 'www.youtube.com' &&
    url.hostname !== 'youtube.com' &&
    url.hostname !== 'youtu.be'
  ) {
    return undefined
  }
  if (url.hostname === 'youtu.be') {
    const videoId = url.pathname.split('/')[1]
    if (!videoId) {
      return undefined
    }
    return videoId
  }
  const videoId = url.searchParams.get('v') as string
  if (!videoId) {
    return undefined
  }
  return videoId
}
