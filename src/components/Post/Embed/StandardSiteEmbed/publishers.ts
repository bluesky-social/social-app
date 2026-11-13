import {Leaflet} from '#/components/icons/community/Leaflet'
import {Offprint} from '#/components/icons/community/Offprint'
import {Pckt} from '#/components/icons/community/Pckt'
import {type app} from '#/lexicons'

export type StandardSitePublisher = {
  host: string
  name: string
  Icon: typeof Leaflet
}

const STANDARD_SITE_PUBLISHERS: StandardSitePublisher[] = [
  {host: 'leaflet.pub', name: 'Leaflet', Icon: Leaflet},
  {host: 'pckt.blog', name: 'pckt', Icon: Pckt},
  {host: 'offprint.app', name: 'Offprint', Icon: Offprint},
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

/**
 * Matches the publication's host, falling back to the article's own URL when
 * the view has no publication source.
 */
export function matchStandardSiteHostByPublication(
  view: app.bsky.embed.external.ViewExternal,
): StandardSitePublisher | null {
  return matchHostByDomain(view.source?.uri || view.uri)
}

export function matchStandardSiteHostByUrl(
  url: string | undefined,
): StandardSitePublisher | null {
  return matchHostByDomain(url || '')
}
