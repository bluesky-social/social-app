/*
 * Note: the dataSet properties are used to leverage custom CSS in public/index.html
 */

import {useEffect, useState} from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {
  FontAwesomeIcon,
  type FontAwesomeIconStyle,
  type Props as FontAwesomeProps,
} from '@fortawesome/react-native-fontawesome'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'

const DURATION = 60000

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

const TOAST_TYPE_TO_ICON: Record<ToastType, FontAwesomeProps['icon']> = {
  default: 'check',
  success: 'check',
  error: 'exclamation',
  warning: 'circle-exclamation',
  info: 'info',
}

interface ActiveToast {
  text: string
  icon: FontAwesomeProps['icon']
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
  useEffect(() => {
    globalSetActiveToast = (t: ActiveToast | undefined) => {
      setActiveToast(t)
    }
  })

  const t = useTheme()

  const TOAST_TYPE_TO_STYLES = {
    default: {
      backgroundColor: t.atoms.text_contrast_low.color,
      borderColor: t.atoms.border_contrast_medium.borderColor,
      iconColor: '#fff',
      textColor: '#fff',
    },
    success: {
      backgroundColor: '#059669',
      borderColor: '#047857',
      iconColor: '#fff',
      textColor: '#fff',
    },
    error: {
      backgroundColor: t.palette.negative_100,
      borderColor: t.palette.negative_400,
      iconColor: t.palette.negative_600,
      textColor: t.palette.negative_600,
    },
    warning: {
      backgroundColor: t.palette.negative_500,
      borderColor: t.palette.negative_600,
      iconColor: '#fff',
      textColor: '#fff',
    },
    info: {
      backgroundColor: t.atoms.text_contrast_low.color,
      borderColor: t.atoms.border_contrast_medium.borderColor,
      iconColor: '#fff',
      textColor: '#fff',
    },
  }

  const toastStyles = activeToast
    ? TOAST_TYPE_TO_STYLES[activeToast.type]
    : TOAST_TYPE_TO_STYLES.default

  return (
    <>
      {activeToast && (
        <View
          style={[
            styles.container,
            {
              backgroundColor: toastStyles.backgroundColor,
              borderColor: toastStyles.borderColor,
            },
          ]}>
          <FontAwesomeIcon
            icon={activeToast.icon}
            size={20}
            style={
              [
                styles.icon,
                {color: toastStyles.iconColor},
              ] as FontAwesomeIconStyle
            }
          />
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
  type: ToastType | FontAwesomeProps['icon'] = 'default',
) {
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }

  // Determine if type is a semantic type or direct icon
  const isSemanticType = typeof type === 'string' && type in TOAST_TYPE_TO_ICON
  const icon = isSemanticType
    ? TOAST_TYPE_TO_ICON[type as ToastType]
    : (type as FontAwesomeProps['icon'])
  const toastType = isSemanticType ? (type as ToastType) : 'default'

  globalSetActiveToast?.({text, icon, type: toastType})
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
    maxWidth: 350,
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
  icon: {
    flexShrink: 0,
  },
  text: {
    marginLeft: 10,
  },
})
