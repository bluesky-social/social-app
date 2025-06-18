import React from 'react'
import {StyleSheet, type TextProps} from 'react-native'
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  type PathProps,
  Stop,
  type SvgProps,
} from 'react-native-svg'
import {Image} from 'expo-image'

import {colors} from '#/lib/styles'
import {useKawaiiMode} from '#/state/preferences/kawaii'

const ratio = 57 / 64

type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = React.forwardRef(function LogoImpl(props: Props, ref) {
  const {fill, ...rest} = props
  const gradient = fill === 'sky'
  const styles = StyleSheet.flatten(props.style)
  const _fill = gradient ? 'url(#sky)' : fill || styles?.color || colors.blue3
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  const isKawaii = useKawaiiMode()

  if (isKawaii) {
    return (
      <Image
        source={
          size > 100
            ? require('../../../assets/kawaii.png')
            : require('../../../assets/kawaii_smol.png')
        }
        accessibilityLabel="smol life"
        accessibilityHint=""
        accessibilityIgnoresInvertColors
        style={[{height: size, aspectRatio: 1.4}]}
      />
    )
  }

  return (
    <Svg
      fill="none"
      // @ts-ignore it's fiiiiine
      ref={ref}
      viewBox="0 0 256 256"
      {...rest}
      style={[{width: size, height: size * ratio}, styles]}>
      {gradient && (
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A7AFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#59B9FF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
      )}
      <G
        transform="translate(0.000000,256.000000) scale(0.100000,-0.100000)"
        fill="#61389d"
        stroke="none">
        <Path
          d="M1036 2040 c-246 -39 -498 -177 -583 -320 -59 -98 -37 -201 65 -305
      60 -61 177 -137 266 -172 37 -15 74 -36 81 -48 14 -20 55 -158 55 -182 0 -7
      -9 -13 -20 -13 -28 0 -25 -18 5 -32 28 -13 32 -26 11 -34 -24 -9 -54 14 -66
      50 -13 39 3 35 -238 67 -115 16 -166 19 -174 11 -17 -17 -1 -29 49 -37 110
      -16 159 -62 207 -189 46 -120 105 -184 201 -216 21 -7 37 -22 48 -45 28 -60
      79 -69 57 -10 -22 59 0 61 55 5 43 -44 71 -53 61 -20 -3 11 -9 29 -12 40 -10
      30 32 26 59 -6 62 -74 83 -80 71 -18 -7 39 -8 39 42 17 31 -13 72 -17 189 -17
      l150 -1 0 46 c0 38 6 53 35 86 19 21 44 52 55 68 17 23 31 29 79 36 38 5 67 4
      83 -4 18 -8 29 -8 44 1 35 22 39 15 32 -66 -5 -66 -2 -85 15 -125 39 -88 74
      -40 51 70 -7 32 -12 75 -12 96 1 49 1 79 0 125 0 20 4 71 10 112 11 80 9 100
      -12 100 -29 0 -50 -72 -48 -167 0 -51 -2 -93 -6 -93 -4 0 -16 7 -29 15 -17 12
      -26 13 -42 5 -52 -28 -71 69 -25 131 13 19 32 44 41 56 34 47 17 53 -136 53
      -108 0 -140 3 -140 13 0 7 9 41 21 75 20 61 23 64 83 94 89 45 177 110 234
      174 48 54 57 59 156 91 58 19 106 39 106 44 0 11 -76 47 -158 73 -41 14 -69
      34 -130 95 -117 117 -271 200 -472 253 -87 23 -318 33 -414 18z m547 -876
      c-15 -40 -23 -50 -46 -52 -32 -4 -34 9 -11 67 10 27 25 43 42 49 35 12 38 -1
      15 -64z m-578 14 c90 -19 345 -16 420 4 32 10 61 15 63 13 6 -6 -27 -100 -43
      -121 -8 -10 -15 -27 -15 -37 0 -18 -23 -31 -71 -41 -15 -3 -35 -21 -50 -43
      -36 -56 -60 -65 -165 -59 -116 5 -164 24 -164 63 0 16 -4 33 -9 39 -8 8 -61
      181 -61 199 0 4 8 4 18 1 9 -2 44 -10 77 -18z m633 -232 c3 -40 -10 -59 -35
      -49 -14 5 -19 74 -6 87 18 18 38 -1 41 -38z m90 32 c31 -31 0 -105 -33 -78
      -25 21 -14 90 15 90 3 0 11 -5 18 -12z"
        />
        <Path
          d="M1998 1986 c-53 -19 -128 -65 -135 -83 -4 -10 20 -41 70 -91 l76 -76
      6 30 c9 40 52 195 60 217 9 21 -22 23 -77 3z"
        />
        <Path
          d="M1930 1394 l-75 -75 39 -35 c36 -32 129 -74 161 -74 19 0 19 12 -4
      89 -11 35 -23 87 -27 117 -3 30 -9 54 -13 54 -4 0 -40 -34 -81 -76z"
        />
      </G>
    </Svg>
  )
})
