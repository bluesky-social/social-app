import React from 'react'

import {Button, ButtonProps} from '#/components/Button'
import {NormalizedPressable} from '#/components/NormalizedPressable'

export function BottomSheetButton({children, ...rest}: ButtonProps) {
  return (
    <Button {...rest} Component={NormalizedPressable}>
      {children}
    </Button>
  )
}
