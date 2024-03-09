import {
  DEFAULT_LABEL_SETTINGS,
  BskyAgent,
  interpretLabelValueDefinitions,
} from '@atproto/api'

import {usePreferencesQuery} from './index'
import {useLabelersDetailedInfoQuery} from '../labeler'

/**
 * More strict than our default settings for logged in users.
 */
export const DEFAULT_LOGGED_OUT_LABEL_PREFERENCES: typeof DEFAULT_LABEL_SETTINGS =
  Object.fromEntries(
    Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
  )

export function useMyLabelers() {
  const prefs = usePreferencesQuery()
  const dids = BskyAgent.modAuthoritiesHeader.concat(
    prefs.data?.moderationPrefs.labelers.map(l => l.did) || [],
  )
  const labelers = useLabelersDetailedInfoQuery({dids})
  return {
    isLoading: prefs.isLoading || labelers.isLoading,
    error: prefs.error || labelers.error,
    data: labelers.data,
  }
}

export function useLabelDefinitions() {
  const labelers = useMyLabelers()
  return {
    labelDefs: Object.fromEntries(
      (labelers.data || []).map(labeler => [
        labeler.creator.did,
        interpretLabelValueDefinitions(labeler),
      ]),
    ),
    labelers: labelers.data || [],
  }
}
