import {AtUri} from '@gander-social-atproto/api'

import {GNDR_FEED_OWNER_DIDS} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences'

let debugTopics = ''
if (isWeb && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  debugTopics = params.get('debug_topics') ?? ''
}

export function createGndrTopicsHeader(userInterests?: string) {
  return {
    'X-Gndr-Topics': debugTopics || userInterests || '',
  }
}

export function aggregateUserInterests(
  preferences?: UsePreferencesQueryResponse,
) {
  return preferences?.interests?.tags?.join(',') || ''
}

export function isGanderOwnedFeed(feedUri: string) {
  const uri = new AtUri(feedUri)
  return GNDR_FEED_OWNER_DIDS.includes(uri.host)
}
