import {createContext, useContext} from 'react'

import {type ToastApi} from '#/components/Toast/types'

export type ToastContext = ToastApi

export const Context = createContext<ToastContext>({
  show() {},
})

export function useToast() {
  return useContext(Context)
}
