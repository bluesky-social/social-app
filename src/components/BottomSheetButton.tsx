import React from 'react'

import {Button, ButtonProps} from '#/components/Button'
import {NormalizedRNGHPressable} from '#/components/NormalizedRNGHPressable'

export function BottomSheetButton({children, ...rest}: ButtonProps) {
  return (
    <Button {...rest} PressableComponent={NormalizedRNGHPressable}>
      {children}
    </Button>
  )
}
