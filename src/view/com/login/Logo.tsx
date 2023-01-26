import React from 'react'
import {StyleSheet} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {s, gradients} from '../../lib/styles'
import {Text} from '../util/text/Text'

export const LogoTextHero = () => {
  return (
    <LinearGradient
      colors={[gradients.blue.start, gradients.blue.end]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[styles.textHero]}>
      <Text type="title-lg" style={[s.white, s.bold]}>
        Bluesky
      </Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  logo: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  textHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    paddingVertical: 15,
    marginBottom: 20,
  },
})
