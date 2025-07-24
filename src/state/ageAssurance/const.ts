import {type ModerationPrefs} from '@atproto/api'

import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'

export const AGE_RESTRICTED_MODERATION_PREFS: Partial<ModerationPrefs> = {
  adultContentEnabled: false,
  labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
}

export const makeAgeRestrictedModerationPrefs = (
  prefs: ModerationPrefs,
): ModerationPrefs => ({
  ...prefs,
  ...AGE_RESTRICTED_MODERATION_PREFS,
})
