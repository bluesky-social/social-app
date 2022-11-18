import {AtUri} from '../../third-party/uri'
import {Entity} from '../../third-party/api/src/client/types/app/bsky/feed/post'
import {PROD_SERVICE} from '../../state'

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
  const urip = new AtUri(`at://host/`)
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

export function extractEntities(
  text: string,
  knownHandles?: Set<string>,
): Entity[] | undefined {
  let match
  let ents: Entity[] = []
  {
    // mentions
    const re = /(^|\s)(@)([a-zA-Z0-9\.-]+)(\b)/dg
    while ((match = re.exec(text))) {
      if (knownHandles && !knownHandles.has(match[3])) {
        continue // not a known handle
      }
      ents.push({
        type: 'mention',
        value: match[3],
        index: {
          start: match.indices[2][0], // skip the (^|\s) but include the '@'
          end: match.indices[3][1],
        },
      })
    }
  }
  {
    // links
    const re = /(^|\s)(https?:\/\/[\S]+)(\b)/dg
    while ((match = re.exec(text))) {
      ents.push({
        type: 'link',
        value: match[2],
        index: {
          start: match.indices[1][0], // skip the (^|\s) but include the '@'
          end: match.indices[2][1],
        },
      })
    }
  }
  return ents.length > 0 ? ents : undefined
}

export function makeValidHandle(str: string): string {
  if (str.length > 20) {
    str = str.slice(0, 20)
  }
  str = str.toLowerCase()
  return str.replace(/^[^a-z]+/g, '').replace(/[^a-z0-9-]/g, '')
}

export function createFullHandle(name: string, domain: string): string {
  name = name.replace(/[\.]+$/, '')
  domain = domain.replace(/^[\.]+/, '')
  return `${name}.${domain}`
}

export function enforceLen(str: string, len: number): string {
  str = str || ''
  if (str.length > len) {
    return str.slice(0, len)
  }
  return str
}

export function cleanError(str: string): string {
  if (str.includes('Network request failed')) {
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
