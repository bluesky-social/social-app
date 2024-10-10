import React from 'react'
import {
  BskyAgent,
  DEFAULT_LABEL_SETTINGS,
  interpretLabelValueDefinitions,
} from '@atproto/api'

import {isNonConfigurableModerationAuthority} from '#/state/session/additional-moderation-authorities'
import {useLabelersDetailedInfoQuery} from '../labeler'
import {usePreferencesQuery} from './index'

/**
 * More strict than our default settings for logged in users.
 */
export const DEFAULT_LOGGED_OUT_LABEL_PREFERENCES: typeof DEFAULT_LABEL_SETTINGS =
  Object.fromEntries(
    Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
  )

export function useMyLabelersQuery({
  excludeNonConfigurableLabelers = false,
}: {
  excludeNonConfigurableLabelers?: boolean
} = {}) {
  const prefs = usePreferencesQuery()
  let dids = Array.from(
    new Set(
      BskyAgent.appLabelers.concat(
        prefs.data?.moderationPrefs.labelers.map(l => l.did) || [],
      ),
    ),
  )
  if (excludeNonConfigurableLabelers) {
    dids = dids.filter(did => !isNonConfigurableModerationAuthority(did))
  }
  const labelers = useLabelersDetailedInfoQuery({dids})
  const isLoading = prefs.isLoading || labelers.isLoading
  const error = prefs.error || labelers.error
  return React.useMemo(() => {
    return {
      isLoading,
      error,
      data: labelers.data,
    }
  }, [labelers, isLoading, error])
}

export function useLabelDefinitionsQuery() {
  const labelers = useMyLabelersQuery()
  return React.useMemo(() => {
    return {
      labelDefs: Object.fromEntries(
        (labelers.data || []).map(labeler => [
          labeler.creator.did,
          interpretLabelValueDefinitions(labeler),
        ]),
      ),
      labelers: labelers.data || [],
    }
  }, [labelers])
}
