import React from 'react'
import {View} from 'react-native'
import {nanoid} from 'nanoid/non-secure'
import {toast as sonner, Toaster} from 'sonner-native'

import {atoms as a} from '#/alf'
import {DURATION} from '#/components/Toast/const'
import {
  Default as DefaultToast,
  Outer as BaseOuter,
  type ToastComponentProps,
  ToastConfigProvider,
} from '#/components/Toast/Toast'
import {type BaseToastOptions} from '#/components/Toast/types'

export {DURATION} from '#/components/Toast/const'
export {Action, Icon, Text} from '#/components/Toast/Toast'
export {type ToastType} from '#/components/Toast/types'

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

export function Outer({
  children,
  type = 'default',
}: {
  children: React.ReactNode
  type?: ToastComponentProps['type']
}) {
  return (
    <View style={[a.px_xl, a.w_full]}>
      <BaseOuter type={type}>{children}</BaseOuter>
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
  const id = nanoid()

  if (typeof content === 'string') {
    sonner.custom(
      <ToastConfigProvider id={id}>
        <Default content={content} type={type} />
      </ToastConfigProvider>,
      {
        ...options,
        id,
        duration: options?.duration ?? DURATION,
      },
    )
  } else if (React.isValidElement(content)) {
    sonner.custom(
      <ToastConfigProvider id={id}>{content}</ToastConfigProvider>,
      {
        ...options,
        id,
        duration: options?.duration ?? DURATION,
      },
    )
  } else {
    throw new Error(
      `Toast can be a string or a React element, got ${typeof content}`,
    )
  }
}
