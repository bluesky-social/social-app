import React from 'react'
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
import LogoSvg from '../../../assets/icons/logomark.svg'
import {IS_WEB} from '#/env'

const ratio = 57 / 64

type Props = {
  fill?: PathProps['fill']
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = React.forwardRef(function LogoImpl(props: Props, ref) {
  const t = useTheme()
  const {fill, ...rest} = props
  const gradient = fill === 'sky'
  const styles = flatten(props.style)
  const _fill = gradient
    ? 'url(#sky)'
    : fill || styles?.color || t.palette.primary_500
  // @ts-ignore
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
        accessibilityLabel="Bluesky"
        accessibilityHint=""
        accessibilityIgnoresInvertColors
        style={[{height: size, aspectRatio: 1.4}]}
      />
    )
  }

  // handle web where SVG import may be a URL string
  const SvgImport: any = LogoSvg
  const isUrl = typeof SvgImport === 'string'

  if (IS_WEB && isUrl) {
    // Render a standard <img> on web when import is a URL
    // @ts-ignore
    return (
      // plain img is fine on web build
      <img
        src={SvgImport}
        width={size}
        height={size * ratio}
        style={styles as any}
        alt="Bluesky"
        // @ts-ignore
        ref={ref}
      />
    )
  }

  return (
    // SVG component (native / transformer-enabled web)
    // @ts-ignore
    <LogoSvg
      width={size}
      height={size * ratio}
      fill={_fill}
      style={styles}
      {...rest}
      // @ts-ignore
      ref={ref}
    />
  )
})
