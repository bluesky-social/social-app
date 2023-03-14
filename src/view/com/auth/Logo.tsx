import React from 'react'
import {StyleSheet, View} from 'react-native'
import {s, colors} from 'lib/styles'
import {Text} from '../util/text/Text'

export const LogoTextHero = () => {
  return (
    <View style={[styles.textHero]}>
      <Text type="title-lg" style={[s.white, s.bold]}>
        Bluesky
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  textHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    paddingVertical: 15,
    marginBottom: 20,
    backgroundColor: colors.blue3,
  },
})
