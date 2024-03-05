import React from 'react'
import {Props as SVGIconProps} from '#/components/icons/common'

import * as Dialog from '#/components/Dialog'
import {TextStyleProp, ViewStyleProp} from '#/alf'

export type ContextType = {
  control: Dialog.DialogOuterProps['control']
}

export type TriggerChildProps =
  | {
      isNative: true
      control: Dialog.DialogOuterProps['control']
      state: {
        /**
         * Web only, `false` on native
         */
        hovered: false
        focused: boolean
        pressed: boolean
      }
      handlers: {
        onPress: () => void
        onFocus: () => void
        onBlur: () => void
        onPressIn: () => void
        onPressOut: () => void
      }
    }
  | {
      isNative: false
      control: Dialog.DialogOuterProps['control']
      state: {
        hovered: boolean
        focused: boolean
        /**
         * Native only, `false` on web
         */
        pressed: false
      }
      handlers: {}
    }

export type ItemProps = React.PropsWithChildren<
  ViewStyleProp & {
    label: string
    onPress: () => void
  }
>

export type ItemTextProps = React.PropsWithChildren<TextStyleProp & {}>
export type ItemIconProps = React.PropsWithChildren<{
  icon: React.ComponentType<SVGIconProps>
  position?: 'left' | 'right'
}>

export type GroupProps = React.PropsWithChildren<ViewStyleProp & {}>
