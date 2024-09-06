import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {ModerationCause, ModerationUI} from '@atproto/api'

import {getModerationCauseKey} from '#/lib/moderation'
import * as Pills from '#/components/Pills'

const MAX_LABELS = 2

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
  const [isOverflowExpanded, setIsOverflowExpanded] = React.useState(false)

  const labels = React.useMemo(() => {
    return [...modui.alerts, ...modui.informs, ...(additionalCauses ?? [])]
  }, [modui.alerts, modui.informs, additionalCauses])

  if (!modui.alert && !modui.inform && !additionalCauses?.length) {
    return null
  }

  return (
    <Pills.Row size={size} style={[size === 'sm' && {marginLeft: -3}, style]}>
      {labels
        .slice(0, isOverflowExpanded ? undefined : MAX_LABELS)
        .map(cause => (
          <Pills.Label
            key={getModerationCauseKey(cause)}
            cause={cause}
            size={size}
            noBg={size === 'sm'}
          />
        ))}
      {labels.length > MAX_LABELS && (
        <Pills.Overflow
          count={labels.length - MAX_LABELS}
          size={size}
          isExpanded={isOverflowExpanded}
          onToggle={() => setIsOverflowExpanded(!isOverflowExpanded)}
          noBg={size === 'sm'}
        />
      )}
    </Pills.Row>
  )
}
