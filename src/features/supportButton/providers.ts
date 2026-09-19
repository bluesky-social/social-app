import {type SupportProvider} from './types'

/*
 * Providers we recognize get their logo on the button and light up cards in
 * the timeline. Any other link is still allowed - it just gets the heart.
 */
export const SUPPORT_PROVIDERS: SupportProvider[] = [
  {id: 'kofi', name: 'Ko-fi', hosts: ['ko-fi.com']},
  {id: 'patreon', name: 'Patreon', hosts: ['patreon.com']},
  {
    id: 'buymeacoffee',
    name: 'Buy Me a Coffee',
    hosts: ['buymeacoffee.com', 'buymeacoff.ee'],
  },
  {id: 'github', name: 'GitHub Sponsors', hosts: ['github.com/sponsors']},
  {id: 'liberapay', name: 'Liberapay', hosts: ['liberapay.com']},
  {id: 'paypal', name: 'PayPal', hosts: ['paypal.me', 'paypal.com']},
  {
    id: 'stripe',
    name: 'Stripe',
    hosts: ['buy.stripe.com', 'donate.stripe.com'],
  },
  {id: 'venmo', name: 'Venmo', hosts: ['venmo.com']},
  {id: 'cashapp', name: 'Cash App', hosts: ['cash.app']},
  {id: 'throne', name: 'Throne', hosts: ['throne.com']},
  {id: 'gumroad', name: 'Gumroad', hosts: ['gumroad.com']},
  {id: 'itchio', name: 'itch.io', hosts: ['itch.io']},
  {id: 'etsy', name: 'Etsy', hosts: ['etsy.com']},
  {id: 'bigcartel', name: 'Big Cartel', hosts: ['bigcartel.com']},
  {id: 'redbubble', name: 'Redbubble', hosts: ['redbubble.com']},
  {id: 'vgen', name: 'VGen', hosts: ['vgen.co']},
  {id: 'boosty', name: 'Boosty', hosts: ['boosty.to']},
  {
    id: 'opencollective',
    name: 'Open Collective',
    hosts: ['opencollective.com'],
  },
  {id: 'gofundme', name: 'GoFundMe', hosts: ['gofundme.com']},
  {id: 'justgiving', name: 'JustGiving', hosts: ['justgiving.com']},
  {id: 'kickstarter', name: 'Kickstarter', hosts: ['kickstarter.com']},
  {id: 'indiegogo', name: 'Indiegogo', hosts: ['indiegogo.com']},
  {id: 'onlyfans', name: 'OnlyFans', hosts: ['onlyfans.com']},
]

function normalize(uri: string): URL | null {
  try {
    const withScheme = /^https?:\/\//i.test(uri) ? uri : `https://${uri}`
    return new URL(withScheme)
  } catch {
    return null
  }
}

function hostMatches(host: string, target: string) {
  return host === target || host.endsWith('.' + target)
}

/**
 * Returns the recognized provider for a URL, or null if the destination isn't
 * on the allowlist. Host entries may carry a path prefix (e.g.
 * `github.com/sponsors`) so a whole site isn't allowlisted by accident.
 */
export function getSupportProvider(uri: string): SupportProvider | null {
  const url = normalize(uri)
  if (!url) return null
  const host = url.hostname.toLowerCase()
  const path = url.pathname.toLowerCase()

  for (const provider of SUPPORT_PROVIDERS) {
    for (const entry of provider.hosts) {
      const [entryHost, ...entryPath] = entry.split('/')
      if (!hostMatches(host, entryHost)) continue
      if (entryPath.length && !path.startsWith('/' + entryPath.join('/'))) {
        continue
      }
      return provider
    }
  }
  return null
}

export function isSupportLink(uri: string | undefined): boolean {
  return !!uri && getSupportProvider(uri) !== null
}

/**
 * Coerces user input into a canonical https URL, or null if it can't be one.
 */
export function normalizeSupportUri(input: string): string | null {
  const url = normalize(input.trim())
  if (!url) return null
  // "hello" parses as a valid URL; insist on something that looks like a host
  if (!url.hostname.includes('.')) return null
  url.protocol = 'https:'
  return url.toString()
}

/**
 * Pulls the first recognized support URL out of free text. Used to light up
 * the button on profiles whose bio already links to Ko-fi, Patreon, etc.
 */
export function findSupportUriInText(text: string | undefined): string | null {
  if (!text) return null
  const matches = text.match(
    /https?:\/\/[^\s)]+|(?:^|\s)((?:[\w-]+\.)+[a-z]{2,}\/[^\s)]*)/gi,
  )
  if (!matches) return null
  for (const raw of matches) {
    const candidate = raw.trim()
    if (getSupportProvider(candidate)) {
      return normalizeSupportUri(candidate)
    }
  }
  return null
}

/**
 * Friendlier form of a saved link for read-only display: drops the scheme and
 * a leading "www." plus any trailing slash, e.g. "ko-fi.com/name".
 */
export function formatSupportUri(uri: string): string {
  return uri.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
}
