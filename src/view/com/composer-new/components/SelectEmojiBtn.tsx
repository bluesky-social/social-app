import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {EmojiArc_Stroke2_Corner0_Rounded as Emoji} from '#/components/icons/Emoji'

export const SelectEmojiBtn = ({disabled}: {disabled?: boolean}) => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Button
      testID="openEmojiBtn"
      label={_(msg`Emoji picker`)}
      accessibilityHint={_(msg`Opens emoji picker`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <Emoji size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
