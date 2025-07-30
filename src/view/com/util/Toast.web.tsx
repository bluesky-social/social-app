/*
 * Note: the dataSet properties are used to leverage custom CSS in public/index.html
 */

import {useEffect, useState} from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'

import {
  convertLegacyToastType,
  getToastTypeStyles,
  getToastWebAnimationStyles,
  type LegacyToastType,
  TOAST_TYPE_TO_ICON,
  TOAST_WEB_KEYFRAMES,
  type ToastType,
} from '#/view/com/util/Toast.style'
import {atoms as a, useTheme} from '#/alf'

const DURATION = 3500

interface ActiveToast {
  text: string
  type: ToastType
}
type GlobalSetActiveToast = (_activeToast: ActiveToast | undefined) => void

// globals
// =
let globalSetActiveToast: GlobalSetActiveToast | undefined
let toastTimeout: NodeJS.Timeout | undefined

// components
// =
type ToastContainerProps = {}
export const ToastContainer: React.FC<ToastContainerProps> = ({}) => {
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

  useEffect(() => {
    const styleId = 'toast-animations'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = TOAST_WEB_KEYFRAMES
      document.head.appendChild(style)
    }
  }, [])

  const t = useTheme()

  const toastTypeStyles = getToastTypeStyles(t)
  const toastStyles = activeToast
    ? toastTypeStyles[activeToast.type]
    : toastTypeStyles.default

  const IconComponent = activeToast
    ? TOAST_TYPE_TO_ICON[activeToast.type]
    : TOAST_TYPE_TO_ICON.default

  const animationStyles = getToastWebAnimationStyles()

  return (
    <>
      {activeToast && (
        <View
          style={[
            styles.container,
            {
              backgroundColor: toastStyles.backgroundColor,
              borderColor: toastStyles.borderColor,
              ...(isExiting
                ? animationStyles.exiting
                : animationStyles.entering),
            },
          ]}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: 'transparent',
              },
            ]}>
            <IconComponent
              fill={toastStyles.iconColor}
              size="sm"
              style={styles.icon}
            />
          </View>
          <Text
            style={[
              styles.text,
              a.text_sm,
              a.font_bold,
              {color: toastStyles.textColor},
            ]}>
            {activeToast.text}
          </Text>
          <Pressable
            style={styles.dismissBackdrop}
            accessibilityLabel="Dismiss"
            accessibilityHint=""
            onPress={() => {
              setActiveToast(undefined)
            }}
          />
        </View>
      )}
    </>
  )
}

// methods
// =

export function show(
  text: string,
  type: ToastType | LegacyToastType = 'default',
) {
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }

  globalSetActiveToast?.({text, type: convertLegacyToastType(type)})
  toastTimeout = setTimeout(() => {
    globalSetActiveToast?.(undefined)
  }, DURATION)
}

const styles = StyleSheet.create({
  container: {
    // @ts-ignore web only
    position: 'fixed',
    left: 20,
    bottom: 20,
    // @ts-ignore web only
    width: 'calc(100% - 40px)',
    maxWidth: 380,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  dismissBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    marginLeft: 10,
  },
})
