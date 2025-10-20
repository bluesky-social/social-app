import React, {useSyncExternalStore} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {nanoid} from 'nanoid/non-secure'
import {toast as sonner} from 'sonner-native'

import {atoms as a} from '#/alf'
import {DURATION} from '#/components/Toast/const'
import {
  Icon as ToastIcon,
  Outer as BaseOuter,
  Text as ToastText,
  ToastConfigProvider,
} from '#/components/Toast/Toast'
import {type BaseToastOptions} from '#/components/Toast/types'

export {DURATION} from '#/components/Toast/const'
export {Action, Icon, Text, ToastConfigProvider} from '#/components/Toast/Toast'
export {type ToastType} from '#/components/Toast/types'

type ToastConfig = {
  id: string
  options: BaseToastOptions
  component: React.ReactNode
}

class ToastsManager {
  private toasts: ToastConfig[] = []
  private listeners = new Set<() => void>()

  getToasts = (): ToastConfig[] => {
    return this.toasts
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  sync = () => {
    this.listeners.forEach(listener => listener())
  }

  add = (toast: ToastConfig) => {
    this.toasts = [...this.toasts, toast]
    this.sync()

    setTimeout(() => {
      this.remove(toast.id)
    }, toast.options.duration || DURATION)
  }

  remove = (id: string) => {
    this.toasts = this.toasts.filter(t => t.id !== id)
    this.sync()
  }
}

const manager = new ToastsManager()

export const dismiss = (id: string) => {
  manager.remove(id)
}

/**
 * Toasts are rendered in a global outlet, which is placed at the top of the
 * component tree.
 */
export function ToastOutlet() {
  const toasts = useSyncExternalStore(manager.subscribe, manager.getToasts)
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        a.absolute,
        a.z_50,
        a.w_full,
        a.gap_md,
        {
          top: insets.top,
        },
      ]}>
      {toasts.map(({id, component}) => (
        <React.Fragment key={id}>{component}</React.Fragment>
      ))}
    </View>
  )
}

export function Outer({children}: {children: React.ReactNode}) {
  return (
    <View style={[a.px_xl, a.w_full]}>
      <BaseOuter>{children}</BaseOuter>
    </View>
  )
}

/**
 * Access the full Sonner API
 * @deprecated TBD
 */
export const api = sonner

/**
 * Our base toast API, using the `Toast` export of this file.
 */
export function show(
  content: React.ReactNode,
  {type = 'default', ...options}: BaseToastOptions = {},
) {
  const id = nanoid()

  if (typeof content === 'string') {
    manager.add({
      id,
      options: {
        ...options,
        duration: options?.duration ?? DURATION,
      },
      component: (
        <ToastConfigProvider id={id} type={type}>
          <Outer>
            <ToastIcon />
            <ToastText>{content}</ToastText>
          </Outer>
        </ToastConfigProvider>
      ),
    })
  } else if (React.isValidElement(content)) {
    manager.add({
      id,
      options: {
        ...options,
        duration: options?.duration ?? DURATION,
      },
      component: (
        <ToastConfigProvider id={id} type={type}>
          {content}
        </ToastConfigProvider>
      ),
    })
  } else {
    throw new Error(
      `Toast can be a string or a React element, got ${typeof content}`,
    )
  }
}
