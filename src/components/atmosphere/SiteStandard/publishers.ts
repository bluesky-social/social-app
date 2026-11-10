import {Leaflet} from '#/components/icons/community/Leaflet'
import {Offprint} from '#/components/icons/community/Offprint'
import {Pckt} from '#/components/icons/community/Pckt'
import {type app} from '#/lexicons'

export type StandardSiteHost = {
  domain: string
  name: string
  Icon: typeof Leaflet
}

const STANDARD_SITE_HOSTS: StandardSiteHost[] = [
  {domain: 'leaflet.pub', name: 'Leaflet', Icon: Leaflet},
  {domain: 'pckt.blog', name: 'pckt', Icon: Pckt},
  {domain: 'offprint.app', name: 'Offprint', Icon: Offprint},
]

function domainFromUrl(uri: string | undefined): string | null {
  try {
    return new URL(uri || '').host
  } catch {
    return null
  }
}

function domainMatches(subject: string, predicate: string): boolean {
  return subject === predicate || subject.endsWith('.' + predicate)
}

function matchHostByDomain(url: string): StandardSiteHost | null {
  const domain = domainFromUrl(url)
  if (!domain) return null
  return STANDARD_SITE_HOSTS.find(p => domainMatches(domain, p.domain)) ?? null
}

export function matchStandardSiteHostByPublication(
  view: app.bsky.embed.external.ViewArticlePublication,
): StandardSiteHost | null {
  return matchHostByDomain(view.uri)
}

export function matchStandardSiteHostByUrl(
  url: string | undefined,
): StandardSiteHost | null {
  return matchHostByDomain(url || '')
}
