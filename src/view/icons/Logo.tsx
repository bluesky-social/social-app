import {forwardRef} from 'react'
import {type TextProps} from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Path,
  type PathProps,
  Stop,
  type SvgProps,
} from 'react-native-svg'
import {SvgXml} from 'react-native-svg'
import {Image} from 'expo-image'

import {useKawaiiMode} from '#/state/preferences/kawaii'
import {flatten, useTheme} from '#/alf'
import {getActiveBrand} from '#/brand/activeBrand'

const brand = getActiveBrand()
const {mark, kawaiiAssets} = brand.logo

type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
  earth?: boolean
} & Omit<SvgProps, 'style'>

export const Logo = forwardRef(function LogoImpl(props: Props, ref) {
  const t = useTheme()
  const {fill, earth, ...rest} = props
  const gradient = fill === 'sky'
  const styles = flatten(props.style)
  const _fill = gradient
    ? 'url(#sky)'
    : fill || styles?.color || t.atoms.text.color
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32, 10)

  const isKawaii = useKawaiiMode()

  if (isKawaii && kawaiiAssets) {
    return (
      <Image
        source={size > 100 ? kawaiiAssets.large : kawaiiAssets.small}
        accessibilityLabel={brand.name}
        accessibilityHint=""
        accessibilityIgnoresInvertColors
        style={[{height: size, aspectRatio: 1.4}]}
      />
    )
  }

  const markToRender = earth && brand.logo.earth ? brand.logo.earth : mark

  if ('xml' in markToRender) {
    return (
      <SvgXml
        xml={markToRender.xml}
        width={size}
        height={size * markToRender.ratio}
        // @ts-ignore color drives `currentColor` fills inside the xml
        color={
          typeof _fill === 'string' && _fill !== 'url(#sky)' ? _fill : undefined
        }
      />
    )
  }

  return (
    <Svg
      fill="none"
      // @ts-ignore it's fiiiiine
      ref={ref}
      viewBox={markToRender.viewBox}
      {...rest}
      style={[{width: size, height: size * markToRender.ratio}, styles]}>
      {gradient && (
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A7AFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#59B9FF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
      )}

      <Path fill={_fill} d={markToRender.path} />
    </Svg>
  )
})
