/*
 * Note: relies on styles in #/styles.css
 */

import {useCallback, useEffect, useMemo, useState} from 'react'
import {AccessibilityInfo, Pressable, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {nanoid} from 'nanoid/non-secure'

import {atoms as a, useBreakpoints} from '#/alf'
import {DEFAULT_TOAST_DURATION} from '#/components/Toast/const'
import {Context} from '#/components/Toast/Context'
import * as Portal from '#/components/Toast/Portal'
import {Toast} from '#/components/Toast/Toast'
import {
  type ToastApi,
  type ToastProps,
  type ToastType,
} from '#/components/Toast/types'

export {useToast} from '#/components/Toast/Context'
export {Outlet} from '#/components/Toast/Portal'

const TOAST_ANIMATION_STYLES = {
  entering: {
    animation: 'toastFadeIn 0.3s ease-out forwards',
  },
  exiting: {
    animation: 'toastFadeOut 0.2s ease-in forwards',
  },
}

interface ActiveToast {
  type: ToastType
  content: React.ReactNode
  a11yLabel: string
}
type GlobalSetActiveToast = (_activeToast: ActiveToast | undefined) => void
let globalSetActiveToast: GlobalSetActiveToast | undefined
let toastTimeout: NodeJS.Timeout | undefined
type ToastContainerProps = {}

export function ToastProvider({children}: {children: React.ReactNode}) {
  const {bottom} = useSafeAreaInsets()
  const {gtPhone} = useBreakpoints()
  const [toasts, setToasts] = useState<
    {
      id: string
      toast: ToastProps
      timeout: NodeJS.Timeout
    }[]
  >([])

  const show = useCallback<ToastApi['show']>(props => {
    setToasts(prevToasts => {
      const id = nanoid()
      return [
        ...prevToasts,
        {
          id,
          toast: props,
          timeout: setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(t => t.id !== id))
          }, props.duration || DEFAULT_TOAST_DURATION),
        },
      ]
    })
  }, [])

  useEffect(() => {
    return () => {
      setToasts(toasts => {
        toasts.map(({timeout}) => {
          clearTimeout(timeout)
        })
        return toasts
      })
    }
  }, [])

  const ctx = useMemo(
    () => ({
      show,
    }),
    [show],
  )

  return (
    <Context.Provider value={ctx}>
      <Portal.Provider>
        {children}

        {toasts.length && (
          <Portal.Portal>
            <View
              style={[
                a.fixed,
                a.gap_sm,
                {
                  flexDirection: 'column-reverse',
                  left: a.px_xl.paddingLeft,
                  right: a.px_xl.paddingLeft,
                  bottom: Math.max(bottom, a.px_xl.paddingLeft),
                },
                gtPhone && [
                  {
                    maxWidth: 380,
                  },
                ],
              ]}>
              {toasts.map(({id, toast}) => (
                <Toast key={id} content={toast.content} type={toast.type} />
              ))}
            </View>
          </Portal.Portal>
        )}
      </Portal.Provider>
    </Context.Provider>
  )
}

export const ToastContainer: React.FC<ToastContainerProps> = ({}) => {
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()
  const [activeToast, setActiveToast] = useState<ActiveToast | undefined>()
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    globalSetActiveToast = (t: ActiveToast | undefined) => {
      if (!t && activeToast) {
        setIsExiting(true)
        setTimeout(() => {
          setActiveToast(t)
          setIsExiting(false)
        }, 200)
      } else {
        if (t) {
          AccessibilityInfo.announceForAccessibility(t.a11yLabel)
        }
        setActiveToast(t)
        setIsExiting(false)
      }
    }
  }, [activeToast])

  return (
    <>
      {activeToast && (
        <View
          style={[
            a.fixed,
            {
              left: a.px_xl.paddingLeft,
              right: a.px_xl.paddingLeft,
              bottom: a.px_xl.paddingLeft,
              ...(isExiting
                ? TOAST_ANIMATION_STYLES.exiting
                : TOAST_ANIMATION_STYLES.entering),
            },
            gtPhone && [
              {
                maxWidth: 380,
              },
            ],
          ]}>
          <Toast content={activeToast.content} type={activeToast.type} />
          <Pressable
            style={[a.absolute, a.inset_0]}
            accessibilityLabel={_(
              msg({
                message: `Dismiss message`,
                comment: `Accessibility label for dismissing a toast notification`,
              }),
            )}
            accessibilityHint=""
            onPress={() => setActiveToast(undefined)}
          />
        </View>
      )}
    </>
  )
}

export const toast: ToastApi = {
  show(props) {
    if (toastTimeout) {
      clearTimeout(toastTimeout)
    }

    globalSetActiveToast?.({
      type: props.type,
      content: props.content,
      a11yLabel: props.a11yLabel,
    })

    toastTimeout = setTimeout(() => {
      globalSetActiveToast?.(undefined)
    }, props.duration || DEFAULT_TOAST_DURATION)
  },
}
