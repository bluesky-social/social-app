import React from 'react'
import {StyleSheet, type TextProps} from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Path,
  type PathProps,
  Stop,
  type SvgProps,
} from 'react-native-svg'

import {colors} from '#/lib/styles'

const ratio = 512 / 512

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

  // const isKawaii = useKawaiiMode()

  // if (isKawaii) {
  //   return (
  //     <Image
  //       source={
  //         size > 100
  //           ? require('../../../assets/kawaii.png')
  //           : require('../../../assets/kawaii_smol.png')
  //       }
  //       accessibilityLabel="Bluesky"
  //       accessibilityHint=""
  //       accessibilityIgnoresInvertColors
  //       style={[{height: size, aspectRatio: 1.4}]}
  //     />
  //   )
  // }

  return (
    <Svg
      fill="none"
      // @ts-ignore it's fiiiiine
      ref={ref}
      viewBox="0 0 512 512"
      {...rest}
      style={[{width: size, height: size * ratio}, styles]}>
      {gradient && (
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#a3b18a" stopOpacity="1" />
            <Stop offset="1" stopColor="#344e41" stopOpacity="1" />
          </LinearGradient>
        </Defs>
      )}

      <Path
        fill={_fill}
        d="m 149.96484,186.56641 46.09766,152.95898 c 0,0 -6.30222,-9.61174 -15.60547,-17.47656 -8.87322,-7.50128 -28.4082,-4.04492 -28.4082,-4.04492 0,0 6.14721,39.88867 15.53125,44.39843 10.71251,5.1482 22.19726,0.16993 22.19726,0.16993 0,0 11.7613,-4.87282 22.82032,31.82421 5.26534,17.47196 15.33258,50.877 20.9707,69.58594 2.16717,7.1913 8.83789,7.25781 8.83789,7.25781 0,0 6.67072,-0.0665 8.83789,-7.25781 5.63812,-18.70894 15.70536,-52.11398 20.9707,-69.58594 11.05902,-36.69703 22.82032,-31.82421 22.82032,-31.82421 0,0 11.48475,4.97827 22.19726,-0.16993 9.38404,-4.50976 15.5332,-44.39843 15.5332,-44.39843 0,0 -19.53693,-3.45636 -28.41015,4.04492 -9.30325,7.86482 -15.60547,17.47656 -15.60547,17.47656 l 46.09766,-152.95898 -49.32618,83.84179 -20.34375,-31.1914 6.35547,54.96875 -23.1582,39.36132 c 0,0 -2.97595,5.06226 -5.94336,4.68946 -0.009,-0.001 -0.0169,0.003 -0.0254,0.01 -0.008,-0.007 -0.0167,-0.0109 -0.0254,-0.01 -2.96741,0.3728 -5.94336,-4.68946 -5.94336,-4.68946 l -23.1582,-39.36132 6.35547,-54.96875 -20.34375,31.1914 z"
        transform="matrix(2.6921023,0,0,1.7145911,-396.58283,-308.01527)"
      />
    </Svg>
  )
})
