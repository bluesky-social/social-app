import {toast as burnt} from 'burnt'

import {ToastProps} from './index.types'
import {getSfSymbol, ToastIcon} from './ToastIcon'

export * as Icon from './ToastIcon'

export function toast({message, icon = 'check'}: ToastProps) {
  if (process.env.NODE_ENV === 'test') return
  burnt({
    title: message,
    icon: {
      web: <ToastIcon icon={icon} size="sm" />,
      ios: {name: getSfSymbol(icon), color: 'systemBlue'},
    },
    preset: 'custom',
  })
}
