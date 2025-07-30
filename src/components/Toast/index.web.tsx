/*
 * Note: relies on styles in #/styles.css
 */

import {useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, web} from '#/alf'
import {getToastWebAnimationStyles} from '#/components/Toast/style'
import {Toast} from '#/components/Toast/Toast'
import {type ToastType} from '#/components/Toast/types'

const DURATION = 3500

interface ActiveToast {
  text: string
  type: ToastType
}
type GlobalSetActiveToast = (_activeToast: ActiveToast | undefined) => void
let globalSetActiveToast: GlobalSetActiveToast | undefined
let toastTimeout: NodeJS.Timeout | undefined
type ToastContainerProps = {}

export const ToastContainer: React.FC<ToastContainerProps> = ({}) => {
  const {_} = useLingui()
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
        setActiveToast(t)
        setIsExiting(false)
      }
    }
  }, [activeToast])

  const animationStyles = getToastWebAnimationStyles()

  return (
    <>
      {activeToast && (
        <View
          style={[
            a.fixed,
            {
              left: a.px_xl.paddingLeft,
              bottom: a.px_xl.paddingLeft,
              width: web(`calc(100% - ${a.px_xl.paddingLeft * 2})`),
              maxWidth: 380,
              ...(isExiting
                ? animationStyles.exiting
                : animationStyles.entering),
            },
          ]}>
          <Toast content={activeToast.text} type={activeToast.type} />
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

export function show(text: string, type: ToastType = 'default') {
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }

  globalSetActiveToast?.({text, type})
  toastTimeout = setTimeout(() => {
    globalSetActiveToast?.(undefined)
  }, DURATION)
}
