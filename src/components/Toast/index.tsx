import {View} from 'react-native'
import {toast as sonner, Toaster} from 'sonner-native'

import {atoms as a} from '#/alf'
import {DURATION} from '#/components/Toast/const'
import {
  Toast as BaseToast,
  type ToastComponentProps,
} from '#/components/Toast/Toast'
import {type BaseToastOptions} from '#/components/Toast/types'

export {DURATION} from '#/components/Toast/const'

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
export function Toast({type, content}: ToastComponentProps) {
  return (
    <View style={[a.px_xl, a.w_full]}>
      <BaseToast content={content} type={type} />
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
  sonner.custom(<Toast content={content} type={type} />, {
    ...options,
    duration: options?.duration ?? DURATION,
  })
}
