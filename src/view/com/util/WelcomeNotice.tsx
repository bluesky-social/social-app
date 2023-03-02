import React from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from './text/Text'
import {s} from 'lib/styles'

export function WelcomeNotice() {
  const pal = usePalette('default')
  return (
    <View style={[pal.view, styles.container, pal.border]}>
      <Text type="title-2xl" style={[pal.link, s.bold, s.pb5]} lineHeight={1.1}>
        Bluesky{' '}
        <Text type="title-xl" style={[pal.textLight, s.bold]}>
          private beta
        </Text>
      </Text>
      <Text type="lg" style={[pal.text]}>
        Welcome! Here are some recent posts. Follow their creators to build your
        community.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
})
