import {useCallback, useRef, useState} from 'react'
import {AccessibilityInfo, View} from 'react-native'

import {isWeb} from '#/platform/detection'
import * as Toast from '#/view/com/util/Toast'
import {
  convertLegacyToastType,
  type LegacyToastType,
  type ToastType,
} from '#/view/com/util/Toast.style'
import {atoms as a} from '#/alf'

let NativeToast: any

if (!isWeb) {
  NativeToast = require('#/view/com/util/Toast').Toast
}

interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

const TOAST_TIMEOUT = 3000

export function useComposerToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const nextIdRef = useRef(0)

  const showToast = useCallback(
    (message: string, type: ToastType | LegacyToastType = 'default') => {
      if (isWeb) {
        // APiligrim
        // Use regular Toast.show for web since it works fine with modals
        const convertedType = convertLegacyToastType(type)
        Toast.show(message, convertedType)
        return
      }

      const id = `toast-${nextIdRef.current++}`
      const convertedType = convertLegacyToastType(type)

      AccessibilityInfo.announceForAccessibility(message)

      setToasts(prev => [
        ...prev,
        {
          id,
          message,
          type: convertedType,
        },
      ])

      setTimeout(() => {
        setToasts(current => current.filter(toast => toast.id !== id))
      }, TOAST_TIMEOUT)
    },
    [],
  )

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
  }
}

export function ComposerToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastMessage[]
  removeToast: (id: string) => void
}) {
  //APiligrim
  //Only render on native platforms , web will render toasts outside the composer modal since there is more space
  if (isWeb) return null

  return (
    <View style={[a.absolute, a.inset_0, {zIndex: 1}]} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <View
          key={toast.id}
          style={[
            a.absolute,
            {
              bottom: 280 + index * 50,
              left: 16,
              right: 16,
            },
          ]}>
          <NativeToast
            message={toast.message}
            type={toast.type}
            destroy={() => removeToast(toast.id)}
          />
        </View>
      ))}
    </View>
  )
}
