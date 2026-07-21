import {type StyleProp, type ViewStyle} from 'react-native'
import {type ModerationDecision} from '@atproto/api'

import {getModerationCauseKey, unique} from '#/lib/moderation'
import {type Shadow} from '#/state/cache/types'
import * as Pills from '#/components/Pills'
import type * as bsky from '#/types/bsky'
import {getMuteState} from '#/types/bsky/mute'

export function ProfileHeaderAlerts({
  moderation,
  profile,
  style,
}: {
  moderation: ModerationDecision
  profile: Shadow<bsky.profile.AnyProfileView>
  style?: StyleProp<ViewStyle>
}) {
  const modui = moderation.ui('profileView')
  const muteState = getMuteState(profile.viewer)
  /*
   * The SDK's moderation decisions only know about full mutes. Scoped mutes
   * (reposts and/or quote posts) leave viewer.muted false, so surface them
   * with a synthetic cause carrying the muted kinds.
   */
  const scopedMuteCause: Pills.AppModerationCause | null =
    muteState.isMutedAny && !muteState.muted
      ? {
          type: 'muted',
          source: {type: 'user'},
          priority: 6,
          kinds: [
            ...(muteState.mutedReposts ? (['reposts'] as const) : []),
            ...(muteState.mutedQuoteposts ? (['quoteposts'] as const) : []),
          ],
        }
      : null
  if (!modui.alert && !modui.inform && !scopedMuteCause) {
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
      {scopedMuteCause && <Pills.Label size="lg" cause={scopedMuteCause} />}
    </Pills.Row>
  )
}
