import {type StyleProp, type ViewStyle} from 'react-native'
import {type ModerationDecision} from '@bsky/sdk/moderation'

import {getModerationCauseKey, unique} from '#/lib/moderation'
import * as Pills from '#/components/Pills'
import type * as bsky from '#/types/bsky'

export function ProfileHeaderAlerts({
  moderation,
  profile,
  style,
}: {
  moderation: ModerationDecision
  profile: bsky.profile.AnyProfileView
  style?: StyleProp<ViewStyle>
}) {
  const modui = moderation.ui('profileView')
  const mutedOnlyReposts = profile.viewer?.mutedOnlyReposts

  if (!mutedOnlyReposts && !modui.alert && !modui.inform) {
    return null
  }

  return (
    <Pills.Row size="lg" style={style}>
      {modui.alerts.filter(unique).map(cause => (
        <Pills.Label
          size="lg"
          key={getModerationCauseKey(cause)}
          cause={cause}
        />
      ))}
      {modui.informs.filter(unique).map(cause => (
        <Pills.Label
          size="lg"
          key={getModerationCauseKey(cause)}
          cause={cause}
        />
      ))}
      {mutedOnlyReposts && <Pills.MutedOnlyReposts size="lg" />}
    </Pills.Row>
  )
}
