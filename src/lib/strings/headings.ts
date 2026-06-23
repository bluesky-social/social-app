import {getActiveBrand} from '#/brand/activeBrand'

export function bskyTitle(page: string, unreadCountLabel?: string) {
  const unreadPrefix = unreadCountLabel ? `(${unreadCountLabel}) ` : ''
  return `${unreadPrefix}${page} — ${getActiveBrand().name}`
}
