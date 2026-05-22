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

export function getStandardSitePublisherHost(
  view: AppBskyEmbedExternal.ViewExternal,
): string | null {
  try {
    return new URL(view.source?.uri || '').host
  } catch {
    return null
  }
}

export function hostMatches(host: string, target: string): boolean {
  return host === target || host.endsWith('.' + target)
}

export function matchStandardSitePublisher(
  view: AppBskyEmbedExternal.ViewExternal,
): StandardSitePublisher | null {
  const host = getStandardSitePublisherHost(view)
  if (!host) return null
  return STANDARD_SITE_PUBLISHERS.find(p => hostMatches(host, p.host)) ?? null
}
