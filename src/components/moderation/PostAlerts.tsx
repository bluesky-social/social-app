import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {ModerationUI} from '@atproto/api'

import {getModerationCauseKey} from '#/lib/moderation'
import * as Pills from '#/components/Pills'

export function PostAlerts({
  modui,
  size = 'sm',
  style,
}: {
  modui: ModerationUI
  size?: Pills.CommonProps['size']
  includeMute?: boolean
  style?: StyleProp<ViewStyle>
}) {
  if (!modui.alert && !modui.inform) {
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
    </Pills.Row>
  )
}
