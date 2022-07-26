/*
 * Note: the dataSet properties are used to leverage custom CSS in public/index.html
 */

import React, {useState, useEffect} from 'react'
// @ts-ignore no declarations available -prf
import {Text, View} from 'react-native-web'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

interface ActiveToast {
  text: string
}
type GlobalSetActiveToast = (_activeToast: ActiveToast | undefined) => void

// globals
// =
let globalSetActiveToast: GlobalSetActiveToast | undefined
let toastTimeout: NodeJS.Timeout | undefined

// components
// =
type ToastContainerProps = {}
const ToastContainer: React.FC<ToastContainerProps> = ({}) => {
  const [activeToast, setActiveToast] = useState<ActiveToast | undefined>()
  useEffect(() => {
    globalSetActiveToast = (t: ActiveToast | undefined) => {
      setActiveToast(t)
    }
  })
  return (
    <>
      {activeToast && (
        <View dataSet={{'toast-container': 1}}>
          <FontAwesomeIcon icon="check" size={24} />
          <Text>{activeToast.text}</Text>
        </View>
      )}
    </>
  )
}

// exports
// =
export default {
  show(text: string, _opts: any) {
    console.log('TODO: toast', text)
    if (toastTimeout) {
      clearTimeout(toastTimeout)
    }
    globalSetActiveToast?.({text})
    toastTimeout = setTimeout(() => {
      globalSetActiveToast?.(undefined)
    }, 2e3)
  },
  positions: {
    TOP: 0,
  },
  durations: {
    LONG: 0,
  },
  ToastContainer,
}
