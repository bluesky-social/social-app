/*
 * Note: the dataSet properties are used to leverage custom CSS in public/index.html
 */

import React, {useState, useEffect} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

const DURATION = 3500

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
export const ToastContainer: React.FC<ToastContainerProps> = ({}) => {
  const [activeToast, setActiveToast] = useState<ActiveToast | undefined>()
  useEffect(() => {
    globalSetActiveToast = (t: ActiveToast | undefined) => {
      setActiveToast(t)
    }
  })
  return (
    <>
      {activeToast && (
        <View style={styles.container}>
          <FontAwesomeIcon
            icon="check"
            size={24}
            style={styles.icon as FontAwesomeIconStyle}
          />
          <Text style={styles.text}>{activeToast.text}</Text>
        </View>
      )}
    </>
  )
}

// methods
// =
export function show(text: string) {
  if (toastTimeout) {
    clearTimeout(toastTimeout)
  }
  globalSetActiveToast?.({text})
  toastTimeout = setTimeout(() => {
    globalSetActiveToast?.(undefined)
  }, DURATION)
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    // @ts-ignore web only
    width: 'calc(100% - 40px)',
    maxWidth: 350,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000c',
    borderRadius: 10,
  },
  icon: {
    color: '#fff',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
})
