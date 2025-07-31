/*
 * Note: relies on styles in #/styles.css
 */

import {useEffect, useState} from 'react'
import {AccessibilityInfo, Pressable, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useBreakpoints} from '#/alf'
import {DEFAULT_TOAST_DURATION} from '#/components/Toast/const'
import {Toast} from '#/components/Toast/Toast'
import {type ToastApi, type ToastType} from '#/components/Toast/types'

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
            accessibilityLabel={_(msg`Dismiss toast`)}
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
