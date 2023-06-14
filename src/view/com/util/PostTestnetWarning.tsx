import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from './text/Text'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'

export function PostTestnetWarning() {
  const store = useStores()
  const pal = usePalette('default')
  if (store.session.isTestNetwork) {
    return (
      <View style={styles.container}>
        <Text type="title-2xl" style={[pal.text, styles.text]}>
          TESTNET
        </Text>
      </View>
    )
  }
  return null
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 6,
    right: 10,
  },
  text: {
    fontWeight: 'bold',
    opacity: 0.07,
  },
})
