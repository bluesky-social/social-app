import {type AppBskyEmbedExternal} from '@atproto/api'

import {Leaflet} from '#/components/icons/community/Leaflet'
import {Offprint} from '#/components/icons/community/Offprint'
import {Pckt} from '#/components/icons/community/Pckt'

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
  view: AppBskyEmbedExternal.ViewExternal,
): string | null {
  return hostFromUri(view.source?.uri)
}

export function hostMatches(host: string, target: string): boolean {
  return host === target || host.endsWith('.' + target)
}

function matchByHost(host: string | null): StandardSitePublisher | null {
  if (!host) return null
  return STANDARD_SITE_PUBLISHERS.find(p => hostMatches(host, p.host)) ?? null
}

export function matchStandardSitePublisher(
  view: AppBskyEmbedExternal.ViewExternal,
): StandardSitePublisher | null {
  return matchByHost(getStandardSitePublisherHost(view))
}

export function matchStandardSitePublisherByUri(
  uri: string | undefined,
): StandardSitePublisher | null {
  return matchByHost(hostFromUri(uri))
}
