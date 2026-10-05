import {type useAnalytics} from '#/analytics'
import {getLinkHost, getSupportProvider} from './providers'
import {type ProfileLink} from './types'

/**
 * Logs one event per link actually added or removed between two saved states,
 * so edits made and then undone before saving don't count.
 */
export function logProfileLinkChanges(
  ax: ReturnType<typeof useAnalytics>,
  before: ProfileLink[],
  after: ProfileLink[],
) {
  const beforeUrls = new Set(before.map(link => link.url))
  const afterUrls = new Set(after.map(link => link.url))
  for (const link of after) {
    if (beforeUrls.has(link.url)) continue
    ax.metric('profile:links:add', {
      domain: getLinkHost(link.url),
      supportProvider: getSupportProvider(link.url)?.name,
    })
  }
  for (const link of before) {
    if (afterUrls.has(link.url)) continue
    ax.metric('profile:links:remove', {
      domain: getLinkHost(link.url),
      supportProvider: getSupportProvider(link.url)?.name,
    })
  }
}
