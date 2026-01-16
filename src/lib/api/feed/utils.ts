import {isWeb} from '#/platform/detection'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences'

let debugTopics = ''
if (isWeb && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  debugTopics = params.get('debug_topics') ?? ''
}

export function createBskyTopicsHeader(userInterests?: string) {
  return {
    'X-Bsky-Topics': debugTopics || userInterests || '',
  }
}

export function aggregateUserInterests(
  preferences?: UsePreferencesQueryResponse,
) {
  return preferences?.interests?.tags?.join(',') || ''
}
