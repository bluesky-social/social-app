/* eslint-disable react-native-a11y/has-valid-accessibility-ignores-invert-colors */

import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'

export const SelectPhotoBtn = ({disabled}: {disabled?: boolean}) => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Button
      testID="openGalleryBtn"
      label={_(msg`Gallery`)}
      accessibilityHint={_(msg`Opens device photo gallery`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <Image size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
