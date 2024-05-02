import React from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'

export const SelectThreadgateBtn = ({}: {}) => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Button
      testID="openReplyGateButton"
      label={_(msg`Who can reply`)}
      accessibilityHint={''}
      style={[a.p_sm, a.m_2xs]}
      variant="ghost"
      shape="round"
      color="primary">
      <FontAwesomeIcon
        icon={['far', 'comments']}
        size={20}
        color={t.palette.primary_500}
      />
    </Button>
  )
}
