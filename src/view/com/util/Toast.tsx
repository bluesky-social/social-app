import {toast} from '#/components/Toast'
import {type ToastType} from '#/components/Toast/types'

/**
 * @deprecated use {@link ToastType} and {@link toast} instead
 */
export type LegacyToastType =
  | 'xmark'
  | 'exclamation-circle'
  | 'check'
  | 'clipboard-check'
  | 'circle-exclamation'

export const convertLegacyToastType = (
  type: ToastType | LegacyToastType,
): ToastType => {
  switch (type) {
    // these ones are fine
    case 'default':
    case 'success':
    case 'error':
    case 'warning':
    case 'info':
      return type
    // legacy ones need conversion
    case 'xmark':
      return 'error'
    case 'exclamation-circle':
      return 'warning'
    case 'check':
      return 'success'
    case 'clipboard-check':
      return 'success'
    case 'circle-exclamation':
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * @deprecated use {@link toast} instead
 */
export function show(
  message: string,
  type: ToastType | LegacyToastType = 'default',
): void {
  const convertedType = convertLegacyToastType(type)
  toast.show({
    type: convertedType,
    content: message,
    a11yLabel: message,
  })
}
