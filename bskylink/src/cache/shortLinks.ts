import {HOUR, MINUTE} from '@atproto/common'
import {LRUCache} from 'lru-cache'

import {redirectLogger} from '../logger.js'

/**
 * General-purpose URL shorteners, whose links can lead anywhere. Kept in step
 * with the list the app rejects for profile links. A brand's own short links
 * (youtu.be, amzn.to) only lead to that brand, so they aren't listed.
 */
export const SHORT_LINK_DOMAINS = [
  'adf.ly',
  'bit.ly',
  'bitly.com',
  'bl.ink',
  'buff.ly',
  'clck.ru',
  'cutt.ly',
  'goo.gl',
  'is.gd',
  'lnkd.in',
  'ow.ly',
  'rb.gy',
  'rebrand.ly',
  's.id',
  'short.gy',
  'shorturl.at',
  't.co',
  't.ly',
  'tiny.cc',
  'tinyurl.com',
  'v.gd',
  'x.gd',
]

const MAX_HOPS = 5
const HOP_TIMEOUT_MS = 2_000
/** Expansion holds up a tap, so the whole chain gets this long at most. */
const TOTAL_TIMEOUT_MS = 3_000
const USER_AGENT = 'bskylink (+https://bsky.app)'

export function isShortLink(url: URL): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  // short-link services run on the default ports
  if (url.port) return false
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  return SHORT_LINK_DOMAINS.some(
    domain => host === domain || host.endsWith(`.${domain}`),
  )
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>

/**
 * Follows short links to where they lead, so Safelink can check the
 * destination as well as the short link.
 *
 * Only short-link services are ever contacted: each hop reads the service's
 * redirect without following it, and expansion stops at the first URL that
 * isn't a short link. The destination itself is never fetched, which keeps
 * this from being usable to reach internal hosts.
 */
export class ShortLinkExpander {
  /*
   * A short link can be retargeted by its owner, so results expire. Failures
   * expire sooner, so a slow service is retried before long.
   */
  private cache = new LRUCache<string, string[]>({max: 50_000, ttl: HOUR})

  constructor(private fetcher: Fetcher = fetch) {}

  /**
   * The link, followed by each URL its short links lead to. A link that isn't
   * a short link, or can't be expanded, comes back on its own.
   */
  async expand(link: string): Promise<string[]> {
    let url: URL
    try {
      url = new URL(link)
    } catch {
      return [link]
    }
    if (!isShortLink(url)) return [link]

    const cached = this.cache.get(url.href)
    if (cached) return cached

    const chain = [url.href]
    const deadline = Date.now() + TOTAL_TIMEOUT_MS
    let complete = true
    while (isShortLink(url) && chain.length <= MAX_HOPS) {
      const remaining = deadline - Date.now()
      const next =
        remaining > 0
          ? await this.nextHop(url, Math.min(HOP_TIMEOUT_MS, remaining))
          : undefined
      if (!next) {
        complete = false
        break
      }
      // a loop between short links
      if (chain.includes(next.href)) break
      chain.push(next.href)
      url = next
    }

    this.cache.set(chain[0], chain, complete ? undefined : {ttl: 5 * MINUTE})
    return chain
  }

  private async nextHop(url: URL, timeoutMs: number): Promise<URL | undefined> {
    try {
      const res = await this.fetcher(url.href, {
        method: 'GET',
        redirect: 'manual',
        headers: {'user-agent': USER_AGENT},
        signal: AbortSignal.timeout(timeoutMs),
      })
      void res.body?.cancel()
      const location = res.headers.get('location')
      if (res.status < 300 || res.status >= 400 || !location) {
        return undefined
      }
      const next = new URL(location, url)
      if (next.protocol !== 'https:' && next.protocol !== 'http:') {
        return undefined
      }
      return next
    } catch (err) {
      redirectLogger.debug(
        {err, host: url.hostname},
        'failed to expand short link',
      )
      return undefined
    }
  }
}
