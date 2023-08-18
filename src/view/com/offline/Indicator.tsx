import React, {useEffect, useState} from 'react'
import {StyleSheet, TouchableOpacity, View, ViewStyle} from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {isDesktopWeb, isNative} from 'platform/detection'
import {useStores} from 'state/index'

const Indicator = () => {
  const store = useStores()
  const pal = usePalette('error')
  const showOfflineDetails = () => {
    store.shell.openModal({
      name: 'offline-details',
    })
  }

  const containerStyles: ViewStyle[] = [
    styles.container,
    s.flexRow,
    s.alignCenter,
    pal.view,
  ]

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={showOfflineDetails}
      accessibilityRole="button"
      accessibilityLabel="Show offline details"
      accessibilityHint="Opens modal content describing offline behavior of the app">
      <FontAwesomeIcon icon="wifi" style={s.white as FontAwesomeIconStyle} />
      <Text style={[pal.text, s.f13, s.ml5]}>You're offline</Text>
    </TouchableOpacity>
  )
}

export const OfflineIndicator = () => {
  const [isConnected, setIsConnected] = useState(true)
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected)
    })

    return () => unsubscribe()
  }, [])

  if (isConnected) return null

  if (isNative) {
    return <Indicator />
  }

  return (
    <View style={isDesktopWeb ? styles.desktopWrapper : styles.mobileWrapper}>
      <Indicator />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: isNative ? s.window.width : undefined,
    justifyContent: 'center',
    height: 18,
  },
  // This follows the positioning of the left nav bar on desktop
  desktopWrapper: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
    right: 'calc(50vw + 312px)',
    width: 220,
  },
  mobileWrapper: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
  },
})
