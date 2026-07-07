import {BRAND_DOMAIN} from '#/lib/community/BrandContext'

export function bskyTitle(page: string, unreadCountLabel?: string) {
  const unreadPrefix = unreadCountLabel ? `(${unreadCountLabel}) ` : ''
  return `${unreadPrefix}${page} — ${BRAND_DOMAIN}`
}
