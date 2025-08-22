import React from 'react'
import {View} from 'react-native'
import {toast as sonner, Toaster} from 'sonner-native'

import {atoms as a} from '#/alf'
import {DURATION} from '#/components/Toast/const'
import {
  Default as DefaultToast,
  type ToastComponentProps,
} from '#/components/Toast/Toast'
import {type BaseToastOptions} from '#/components/Toast/types'

export {DURATION} from '#/components/Toast/const'
export {Icon, Outer, Text} from '#/components/Toast/Toast'

/**
 * Toasts are rendered in a global outlet, which is placed at the top of the
 * component tree.
 */
export function ToastOutlet() {
  return <Toaster pauseWhenPageIsHidden gap={a.gap_sm.gap} />
}

/**
 * The toast UI component
 */
export function Default({type, content}: ToastComponentProps) {
  return (
    <View style={[a.px_xl, a.w_full]}>
      <DefaultToast content={content} type={type} />
    </View>
  )
}

/**
 * Access the full Sonner API
 */
export const api = sonner

/**
 * Our base toast API, using the `Toast` export of this file.
 */
export function show(
  content: React.ReactNode,
  {type, ...options}: BaseToastOptions = {},
) {
  if (typeof content === 'string') {
    sonner.custom(<Default content={content} type={type} />, {
      ...options,
      duration: options?.duration ?? DURATION,
    })
  } else if (React.isValidElement(content)) {
    sonner.custom(content, {
      ...options,
      duration: options?.duration ?? DURATION,
    })
  }
}
