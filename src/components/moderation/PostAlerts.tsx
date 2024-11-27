import {StyleProp, ViewStyle} from 'react-native'
import {ModerationCause, ModerationUI} from '@atproto/api'

import {getModerationCauseKey} from '#/lib/moderation'
import * as Pills from '#/components/Pills'

export function PostAlerts({
  modui,
  size = 'sm',
  style,
  additionalCauses,
}: {
  modui: ModerationUI
  size?: Pills.CommonProps['size']
  includeMute?: boolean
  style?: StyleProp<ViewStyle>
  additionalCauses?: ModerationCause[] | Pills.AppModerationCause[]
}) {
  if (!modui.alert && !modui.inform && !additionalCauses?.length) {
    return null
  }

  return (
    <Pills.Row size={size} style={[size === 'sm' && {marginLeft: -3}, style]}>
      {modui.alerts.map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
      {modui.informs.map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
      {additionalCauses?.map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
    </Pills.Row>
  )
}
