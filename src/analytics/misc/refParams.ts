/**
 * This is used for our own Bluesky post embeds, and maybe other things.
 *
 * In the case of our embeds, `ref_src=embed`. Not sure if `ref_url` is used.
 *
 * Referral parameters are captured on page load and retained for seven days so
 * return visits can be attributed to the same source.
 */

import * as env from '#/env'

const STORAGE_KEY = 'bsky.analytics.refParams'
const TTL = 7 * 24 * 60 * 60 * 1000

type RefParams = {
  src: string
  url: string
  timestamp: number
}

function getStoredRefParams(now: number): RefParams | undefined {
  const value = window.localStorage.getItem(STORAGE_KEY)
  if (!value) return

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('src' in parsed) ||
    typeof parsed.src !== 'string' ||
    !('url' in parsed) ||
    typeof parsed.url !== 'string' ||
    (!parsed.src && !parsed.url) ||
    !('timestamp' in parsed) ||
    typeof parsed.timestamp !== 'number' ||
    !Number.isFinite(parsed.timestamp) ||
    parsed.timestamp <= 0 ||
    parsed.timestamp > now ||
    now - parsed.timestamp >= TTL
  ) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  return {src: parsed.src, url: parsed.url, timestamp: parsed.timestamp}
}

let refSrc = ''
let refUrl = ''
if (env.IS_WEB) {
  const params = new URLSearchParams(window.location.search)
  refSrc = params.get('ref_src') ?? ''
  refUrl = decodeURIComponent(params.get('ref_url') ?? '')

  try {
    const now = Date.now()
    const stored = getStoredRefParams(now)
    if (refSrc || refUrl) {
      if (stored?.src !== refSrc || stored?.url !== refUrl) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({src: refSrc, url: refUrl, timestamp: now}),
        )
      }
    } else if (stored) {
      refSrc = stored.src
      refUrl = stored.url
    }
  } catch {
    /* localStorage may be unavailable; keep the current URL's attribution. */
  }
}

export const src = refSrc
export const url = refUrl
