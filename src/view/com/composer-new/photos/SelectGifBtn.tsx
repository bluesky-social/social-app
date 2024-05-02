import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {GifSquare_Stroke2_Corner0_Rounded as Gif} from '#/components/icons/Gif'

export const SelectGifBtn = ({disabled}: {disabled?: boolean}) => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Button
      testID="openGifBtn"
      label={_(msg`Gallery`)}
      accessibilityHint={_(msg`Opens device photo gallery`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <Gif size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
