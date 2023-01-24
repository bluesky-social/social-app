import React from 'react'
import {StyleSheet, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Svg, {Circle, Line, Text as SvgText} from 'react-native-svg'
import {s, gradients} from '../../lib/styles'
import {Text} from '../util/text/Text'

export const Logo = ({color, size = 100}: {color: string; size?: number}) => {
  return (
    <View style={styles.logo}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
        <Line stroke={color} strokeWidth={1} x1="30" x2="30" y1="0" y2="100" />
        <Line stroke={color} strokeWidth={1} x1="74" x2="74" y1="0" y2="100" />
        <Line stroke={color} strokeWidth={1} x1="0" x2="100" y1="22" y2="22" />
        <Line stroke={color} strokeWidth={1} x1="0" x2="100" y1="74" y2="74" />
        <SvgText
          fill="none"
          stroke={color}
          strokeWidth={2}
          fontSize="60"
          fontWeight="bold"
          x="52"
          y="70"
          textAnchor="middle">
          B
        </SvgText>
      </Svg>
    </View>
  )
}

export const LogoTextHero = () => {
  return (
    <LinearGradient
      colors={[gradients.blue.start, gradients.blue.end]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[styles.textHero]}>
      <Logo color="white" size={40} />
      <Text type="title-lg" style={[s.white, s.pl10]}>
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
