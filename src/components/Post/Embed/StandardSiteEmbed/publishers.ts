import {Leaflet} from '#/components/icons/community/Leaflet'
import {Offprint} from '#/components/icons/community/Offprint'
import {Pckt} from '#/components/icons/community/Pckt'
import {type app} from '#/lexicons'

export type StandardSitePublisher = {
  url: string
  host: string
  themeNsidRoot: string
  name: string
  Icon: typeof Leaflet
}

const STANDARD_SITE_PUBLISHERS: StandardSitePublisher[] = [
  {
    url: 'https://bsky.app/profile/leaflet.pub',
    host: 'leaflet.pub',
    themeNsidRoot: 'pub.leaflet',
    name: 'Leaflet',
    Icon: Leaflet,
  },
  {
    url: 'https://bsky.app/profile/pckt.blog',
    host: 'pckt.blog',
    themeNsidRoot: 'blog.pckt',
    name: 'pckt',
    Icon: Pckt,
  },
  {
    url: 'https://bsky.app/profile/offprint.app',
    host: 'offprint.app',
    themeNsidRoot: 'app.offprint',
    name: 'Offprint',
    Icon: Offprint,
  },
]

function hostFromUri(uri: string | undefined): string | null {
  try {
    return new URL(uri || '').host
  } catch {
    return null
  }
}

export function getStandardSitePublisherHost(
  view: app.bsky.embed.external.ViewExternal,
): string | null {
  return hostFromUri(view.source?.uri)
}

export function hostMatches(host: string, target: string): boolean {
  return host === target || host.endsWith('.' + target)
}

function matchHostByDomain(url: string): StandardSitePublisher | null {
  const host = hostFromUri(url)
  if (!host) return null
  return STANDARD_SITE_PUBLISHERS.find(p => hostMatches(host, p.host)) ?? null
}

function matchByThemeNsid(
  view: app.bsky.embed.external.ViewExternal,
): StandardSitePublisher | null {
  const $type = (view.source?.theme as {$type?: unknown} | undefined)?.$type
  if (typeof $type !== 'string') return null
  return (
    STANDARD_SITE_PUBLISHERS.find(
      p =>
        $type === p.themeNsidRoot ||
        $type.startsWith(`${p.themeNsidRoot}.`) ||
        $type.startsWith(`${p.themeNsidRoot}#`),
    ) ?? null
  )
}

export function matchStandardSiteHostByPublication(
  view: app.bsky.embed.external.ViewExternal,
): StandardSitePublisher | null {
  return matchHostByDomain(view.source?.uri || '')
}

export function matchStandardSiteHostByUrl(
  url: string | undefined,
): StandardSitePublisher | null {
  return matchHostByDomain(url || '')
}

/** Uses URL evidence first, then a preserved vendor theme NSID as a hint. */
export function matchStandardSitePublisherByViewHints(
  view: app.bsky.embed.external.ViewExternal,
): StandardSitePublisher | null {
  return (
    matchStandardSiteHostByPublication(view) ||
    matchStandardSiteHostByUrl(view.uri) ||
    matchByThemeNsid(view)
  )
}
