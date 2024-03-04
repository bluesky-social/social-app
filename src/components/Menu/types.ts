import * as Dialog from '#/components/Dialog'

export type ContextType = {
  control: Dialog.DialogOuterProps['control'] | null
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
      control: null
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
