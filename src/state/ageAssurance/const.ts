import {type ModerationPrefs} from '@atproto/api'

import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'

export const AGE_RESTRICTED_MODERATION_PREFS: ModerationPrefs = {
  adultContentEnabled: false,
  labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
  labelers: [],
  mutedWords: [],
  hiddenPosts: [],
}
