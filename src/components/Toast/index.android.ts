import {ToastProps} from './index.types'
import * as LegacyToast from './LegacyToast'

export * as Icon from './ToastIcon'

export function toast({message, icon}: ToastProps) {
  if (process.env.NODE_ENV === 'test') return
  LegacyToast.show(message, icon)
}
