import {AtUri} from '../third-party/uri'
import {AppBskyFeedPost} from '@atproto/api'
type Entity = AppBskyFeedPost.Entity
import {PROD_SERVICE} from '../state'
import {isNetworkError} from './errors'
import TLDs from 'tlds'

export const MAX_DISPLAY_NAME = 64
export const MAX_DESCRIPTION = 256

export function pluralize(n: number, base: string, plural?: string): string {
  if (n === 1) {
    return base
  }
  if (plural) {
    return plural
  }
  return base + 's'
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

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const MONTH = DAY * 30
const YEAR = DAY * 365
export function ago(date: number | string | Date): string {
  let ts: number
  if (typeof date === 'string') {
    ts = Number(new Date(date))
  } else if (date instanceof Date) {
    ts = Number(date)
  } else {
    ts = date
  }
  const diffSeconds = Math.floor((Date.now() - ts) / 1e3)
  if (diffSeconds < MINUTE) {
    return `${diffSeconds}s`
  } else if (diffSeconds < HOUR) {
    return `${Math.floor(diffSeconds / MINUTE)}m`
  } else if (diffSeconds < DAY) {
    return `${Math.floor(diffSeconds / HOUR)}h`
  } else if (diffSeconds < MONTH) {
    return `${Math.floor(diffSeconds / DAY)}d`
  } else if (diffSeconds < YEAR) {
    return `${Math.floor(diffSeconds / MONTH)}mo`
  } else {
    return new Date(ts).toLocaleDateString()
  }
}

export function isValidDomain(str: string): boolean {
  return !!TLDs.find(tld => {
    let i = str.lastIndexOf(tld)
    if (i === -1) {
      return false
    }
    return str.charAt(i - 1) === '.' && i === str.length - tld.length
  })
}

export function extractEntities(
  text: string,
  knownHandles?: Set<string>,
): Entity[] | undefined {
  let match
  let ents: Entity[] = []
  {
    // mentions
    const re = /(^|\s|\()(@)([a-zA-Z0-9\.-]+)(\b)/g
    while ((match = re.exec(text))) {
      if (knownHandles && !knownHandles.has(match[3])) {
        continue // not a known handle
      } else if (!match[3].includes('.')) {
        continue // probably not a handle
      }
      const start = text.indexOf(match[3], match.index) - 1
      ents.push({
        type: 'mention',
        value: match[3],
        index: {start, end: start + match[3].length + 1},
      })
    }
  }
  {
    // links
    const re =
      /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/gm
    while ((match = re.exec(text))) {
      let value = match[2]
      if (!value.startsWith('http')) {
        const domain = match.groups?.domain
        if (!domain || !isValidDomain(domain)) {
          continue
        }
        value = `https://${value}`
      }
      const start = text.indexOf(match[2], match.index)
      const index = {start, end: start + match[2].length}
      // strip ending puncuation
      if (/[.,;!?]$/.test(value)) {
        value = value.slice(0, -1)
        index.end--
      }
      if (/[)]$/.test(value) && !value.includes('(')) {
        value = value.slice(0, -1)
        index.end--
      }
      ents.push({
        type: 'link',
        value,
        index,
      })
    }
  }
  return ents.length > 0 ? ents : undefined
}

interface DetectedLink {
  link: string
}
type DetectedLinkable = string | DetectedLink
export function detectLinkables(text: string): DetectedLinkable[] {
  const re =
    /((^|\s|\()@[a-z0-9\.-]*)|((^|\s|\()https?:\/\/[\S]+)|((^|\s|\()(?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*)/gi
  const segments = []
  let match
  let start = 0
  while ((match = re.exec(text))) {
    let matchIndex = match.index
    let matchValue = match[0]

    if (match.groups?.domain && !isValidDomain(match.groups?.domain)) {
      continue
    }

    if (/\s|\(/.test(matchValue)) {
      // HACK
      // skip the starting space
      // we have to do this because RN doesnt support negative lookaheads
      // -prf
      matchIndex++
      matchValue = matchValue.slice(1)
    }

    {
      // strip ending puncuation
      if (/[.,;!?]$/.test(matchValue)) {
        matchValue = matchValue.slice(0, -1)
      }
      if (/[)]$/.test(matchValue) && !matchValue.includes('(')) {
        matchValue = matchValue.slice(0, -1)
      }
    }

    if (start !== matchIndex) {
      segments.push(text.slice(start, matchIndex))
    }
    segments.push({link: matchValue})
    start = matchIndex + matchValue.length
  }
  if (start < text.length) {
    segments.push(text.slice(start))
  }
  return segments
}

export function makeValidHandle(str: string): string {
  if (str.length > 20) {
    str = str.slice(0, 20)
  }
  str = str.toLowerCase()
  return str.replace(/^[^a-z]+/g, '').replace(/[^a-z0-9-]/g, '')
}

export function createFullHandle(name: string, domain: string): string {
  name = (name || '').replace(/[\.]+$/, '')
  domain = (domain || '').replace(/^[\.]+/, '')
  return `${name}.${domain}`
}

export function enforceLen(str: string, len: number): string {
  str = str || ''
  if (str.length > len) {
    return str.slice(0, len)
  }
  return str
}

export function cleanError(str: any): string {
  if (!str) return str
  if (typeof str !== 'string') {
    str = str.toString()
  }
  if (isNetworkError(str)) {
    return 'Unable to connect. Please check your internet connection and try again.'
  }
  if (str.startsWith('Error: ')) {
    return str.slice('Error: '.length)
  }
  return str
}

export function toNiceDomain(url: string): string {
  try {
    const urlp = new URL(url)
    if (`https://${urlp.host}` === PROD_SERVICE) {
      return 'Bluesky Social'
    }
    return urlp.host
  } catch (e) {
    return url
  }
}

export function toShortUrl(url: string): string {
  try {
    const urlp = new URL(url)
    const shortened =
      urlp.host +
      (urlp.pathname === '/' ? '' : urlp.pathname) +
      urlp.search +
      urlp.hash
    if (shortened.length > 30) {
      return shortened.slice(0, 27) + '...'
    }
    return shortened
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

const htmlTitleRegex = /<title>([^<]+)<\/title>/i
export function extractHtmlMeta(html: string): Record<string, string> {
  const res: Record<string, string> = {}

  {
    const match = htmlTitleRegex.exec(html)
    if (match) {
      res.title = match[1].trim()
    }
  }

  {
    let metaMatch
    let propMatch
    const metaRe = /<meta[\s]([^>]+)>/gis
    while ((metaMatch = metaRe.exec(html))) {
      let propName
      let propValue
      const propRe = /(name|property|content)="([^"]+)"/gis
      while ((propMatch = propRe.exec(metaMatch[1]))) {
        if (propMatch[1] === 'content') {
          propValue = propMatch[2]
        } else {
          propName = propMatch[2]
        }
      }
      if (!propName || !propValue) {
        continue
      }
      switch (propName?.trim()) {
        case 'title':
        case 'og:title':
        case 'twitter:title':
          res.title = propValue?.trim()
          break
        case 'description':
        case 'og:description':
        case 'twitter:description':
          res.description = propValue?.trim()
          break
        case 'og:image':
        case 'twitter:image':
          res.image = propValue?.trim()
          break
      }
    }
  }

  return res
}
