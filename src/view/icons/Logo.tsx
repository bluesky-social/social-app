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
import {Image} from 'expo-image'

import {useKawaiiMode} from '#/state/preferences/kawaii'
import {flatten, useTheme} from '#/alf'
import {EUROSKY} from '#/config/eurosky'
import {EUROSKY_ICON} from '#/config/eurosky-logo'

const ratio = EUROSKY_ICON.ratio

type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = forwardRef(function LogoImpl(props: Props, ref) {
  const t = useTheme()
  const {fill, ...rest} = props
  const gradient = fill === 'sky'
  const styles = flatten(props.style)
  // Brand mark is monochrome - default to the theme text colour (ink on
  // light, cotton on dark), not the accent. Callers can still override.
  const _fill = gradient
    ? 'url(#sky)'
    : fill || styles?.color || t.atoms.text.color
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32, 10)

  const isKawaii = useKawaiiMode()

  if (isKawaii) {
    return (
      <Image
        source={
          size > 100
            ? require('../../../assets/kawaii.png')
            : require('../../../assets/kawaii_smol.png')
        }
        accessibilityLabel={EUROSKY.brand.name}
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
      viewBox={EUROSKY_ICON.viewBox}
      {...rest}
      style={[{width: size, height: size * ratio}, styles]}>
      {gradient && (
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={EUROSKY_ICON.gradient.stop0}
              stopOpacity="1"
            />
            <Stop
              offset="1"
              stopColor={EUROSKY_ICON.gradient.stop1}
              stopOpacity="1"
            />
          </LinearGradient>
        </Defs>
      )}

      <Path fill={_fill} d={EUROSKY_ICON.path} />
    </Svg>
  )
})
