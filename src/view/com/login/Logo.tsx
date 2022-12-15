import React from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Circle, Line, Text as SvgText} from 'react-native-svg'

export const Logo = () => {
  return (
    <View style={styles.logo}>
      <Svg width="100" height="100">
        <Circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="white"
          strokeWidth={2}
        />
        <Line stroke="white" strokeWidth={1} x1="30" x2="30" y1="0" y2="100" />
        <Line stroke="white" strokeWidth={1} x1="74" x2="74" y1="0" y2="100" />
        <Line stroke="white" strokeWidth={1} x1="0" x2="100" y1="22" y2="22" />
        <Line stroke="white" strokeWidth={1} x1="0" x2="100" y1="74" y2="74" />
        <SvgText
          fill="none"
          stroke="white"
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

const styles = StyleSheet.create({
  logo: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
})
