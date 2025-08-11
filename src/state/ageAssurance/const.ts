import {type ModerationPrefs} from '@atproto/api'

import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'

export const makeAgeRestrictedModerationPrefs = (
  prefs: ModerationPrefs,
): ModerationPrefs => ({
  ...prefs,
  adultContentEnabled: false,
  labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
})
