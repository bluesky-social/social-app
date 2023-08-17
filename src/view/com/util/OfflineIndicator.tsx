import React, {useEffect, useState} from 'react'
import {StyleSheet, View, ViewStyle} from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {isNative} from 'platform/detection'
import {CenteredView} from './Views.web'

const Indicator = () => {
  const pal = usePalette('error')

  const containerStyles: ViewStyle[] = [
    styles.container,
    s.flexRow,
    s.alignCenter,
  ]

  if (!isNative) {
    containerStyles.push(pal.view)
  }

  return (
    <View style={containerStyles}>
      <FontAwesomeIcon icon="wifi" style={s.white as FontAwesomeIconStyle} />
      <Text style={[pal.text, s.f13, s.ml5]}>You're offline</Text>
    </View>
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
    <CenteredView>
      <Indicator />
    </CenteredView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: isNative ? s.window.width : undefined,
    justifyContent: 'center',
    height: 20,
  },
})
