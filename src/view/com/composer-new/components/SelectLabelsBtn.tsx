import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ShieldExclamation} from '#/lib/icons'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'

export const SelectLabelsBtn = ({}: {}) => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Button
      testID="labelsBtn"
      label={_(msg`Content warnings`)}
      accessibilityHint={''}
      style={[a.p_sm, a.m_2xs]}
      variant="ghost"
      shape="round"
      color="primary">
      <ShieldExclamation
        size={20}
        strokeWidth={2}
        style={{color: t.palette.primary_500}}
      />
    </Button>
  )
}
