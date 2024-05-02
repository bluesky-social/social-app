import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'

export const OpenCameraBtn = ({disabled}: {disabled?: boolean}) => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Button
      testID="openCameraButton"
      label={_(msg`Camera`)}
      accessibilityHint={_(msg`Opens camera on device`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <Camera size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
