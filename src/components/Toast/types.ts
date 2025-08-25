import {type toast as sonner} from 'sonner-native'

/**
 * This is not exported from `sonner-native` so just hacking it in here.
 */
export type ExternalToast = Exclude<
  Parameters<typeof sonner.custom>[1],
  undefined
>

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

/**
 * Not all properties are available on all platforms, so we pick out only those
 * we support. Add more here as needed.
 */
export type BaseToastOptions = Pick<
  ExternalToast,
  'duration' | 'dismissible' | 'promiseOptions'
> & {
  type?: ToastType

  /**
   * These methods differ between web/native implementations
   */
  onDismiss?: () => void
  onPress?: () => void
  onAutoClose?: () => void
}
