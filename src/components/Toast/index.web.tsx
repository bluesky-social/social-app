import React from 'react'
import {toast as sonner, Toaster} from 'sonner'

import {atoms as a} from '#/alf'
import {DURATION} from '#/components/Toast/const'
import {Default as DefaultToast} from '#/components/Toast/Toast'
import {type BaseToastOptions} from '#/components/Toast/types'

export {DURATION} from '#/components/Toast/const'
export * from '#/components/Toast/Toast'
export {type ToastType} from '#/components/Toast/types'

/**
 * Toasts are rendered in a global outlet, which is placed at the top of the
 * component tree.
 */
export function ToastOutlet() {
  return (
    <Toaster
      position="bottom-left"
      gap={a.gap_sm.gap}
      offset={a.p_xl.padding}
      mobileOffset={a.p_xl.padding}
    />
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
    sonner(<DefaultToast content={content} type={type} />, {
      unstyled: true, // required on web
      ...options,
      duration: options?.duration ?? DURATION,
    })
  } else if (React.isValidElement(content)) {
    sonner(content, {
      unstyled: true, // required on web
      ...options,
      duration: options?.duration ?? DURATION,
    })
  }
}
