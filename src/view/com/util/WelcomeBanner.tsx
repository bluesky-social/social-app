import React from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from './text/Text'
import {s} from 'lib/styles'

export function WelcomeBanner() {
  const pal = usePalette('default')
  return (
    <View
      testID="welcomeBanner"
      style={[pal.view, styles.container, pal.border]}>
      <Text
        type="title-lg"
        style={[pal.text, s.textCenter, s.bold, s.pb5]}
        lineHeight={1.1}>
        Welcome to the private beta!
      </Text>
      <Text type="lg" style={[pal.text, s.textCenter]}>
        Here are some recent posts. Follow their creators to build your feed.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingBottom: 26,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
})
