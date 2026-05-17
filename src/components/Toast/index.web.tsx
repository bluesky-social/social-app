import {isValidElement} from 'react'
import {nanoid} from 'nanoid/non-secure'
import {toast as sonner, Toaster} from 'sonner'

import {atoms as a} from '#/alf'
import {DURATION} from '#/components/Toast/const'
import {
  Icon as ToastIcon,
  Outer as ToastOuter,
  Text as ToastText,
  ToastConfigProvider,
} from '#/components/Toast/Toast'
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
  {type = 'default', ...options}: BaseToastOptions = {},
) {
  const id = nanoid()

  if (typeof content === 'string') {
    sonner(
      <ToastConfigProvider id={id} type={type}>
        <ToastOuter>
          <ToastIcon />
          <ToastText>{content}</ToastText>
        </ToastOuter>
      </ToastConfigProvider>,
      {
        ...options,
        unstyled: true, // required on web
        id,
        duration: options?.duration ?? DURATION,
      },
    )
  } else if (isValidElement(content)) {
    sonner(
      <ToastConfigProvider id={id} type={type}>
        {content}
      </ToastConfigProvider>,
      {
        ...options,
        unstyled: true, // required on web
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

type PromiseToastOptions<T> = Omit<BaseToastOptions, 'type'> & {
  loading: React.ReactNode
  success: React.ReactNode | ((data: T) => React.ReactNode)
  error?: React.ReactNode | ((err: unknown) => React.ReactNode)
}

/**
 * Show a toast tied to a promise. While the promise is pending, the toast
 * displays the `loading` content with a spinner. When the promise settles, the
 * same toast is swapped in place with the `success` or `error` content.
 */
export function promise<T>(
  input: Promise<T>,
  {loading, success, error, ...options}: PromiseToastOptions<T>,
): Promise<T> {
  const id = nanoid()

  const render = (
    content: React.ReactNode,
    type: 'pending' | 'success' | 'error',
  ) => {
    sonner(
      <ToastConfigProvider id={id} type={type}>
        {content}
      </ToastConfigProvider>,
      {
        ...options,
        unstyled: true, // required on web
        id,
        duration: type === 'pending' ? Infinity : (options?.duration ?? DURATION),
        dismissible: type === 'pending' ? false : options?.dismissible,
      },
    )
  }

  render(loading, 'pending')

  return input.then(
    data => {
      const content = typeof success === 'function' ? success(data) : success
      render(content, 'success')
      return data
    },
    err => {
      if (error !== undefined) {
        const content = typeof error === 'function' ? error(err) : error
        render(content, 'error')
      } else {
        sonner.dismiss(id)
      }
      throw err
    },
  )
}
