import {forwardRef} from 'react'
import Svg, {Circle, G, Path} from 'react-native-svg'

import {type Props, useCommonSVGProps} from '#/components/icons/common'
import {type IconWithSvgMeta} from '#/components/icons/TEMPLATE'

const paths = [
  'M127 0a127 127 0 1 0 0 254 127 127 0 0 0 0-254Z',
  'M152.381 0C200.024 7.40286e-05 238.646 38.5227 238.646 86.043C238.646 90.8236 238.255 95.5136 237.503 100.082C247.403 110.842 253.446 125.188 253.446 140.943C253.445 234.623 0.000807966 234.623 0 140.943C0.000106345 122.697 8.10548 106.338 20.9209 95.2539C19.8631 91.0719 19.3008 86.6923 19.3008 82.1826C19.301 52.7655 43.2108 28.918 72.7041 28.918C77.4197 28.918 81.9925 29.5283 86.3477 30.6729C102.172 11.9176 125.881 0 152.381 0Z',
  'M98.7202 95.7432C97.0821 95.5242 95.4542 95.5585 93.8599 95.8213C94.9943 97.6112 95.6547 99.7333 95.6548 102.011C95.6545 108.397 90.4883 113.575 84.1157 113.575C81.2585 113.575 78.6456 112.531 76.6304 110.808C75.1693 113.997 74.1226 117.563 73.6148 121.379C71.5213 137.11 79.3668 151.139 91.1382 152.713C102.9096 154.286 114.15 142.808 116.244 127.077C118.337 111.345 110.492 97.3166 98.7202 95.7432Z',
  'M162.308 95.7422C160.669 95.5232 159.041 95.5572 157.446 95.8203C158.58 97.6104 159.241 99.733 159.241 102.011C159.24 108.397 154.074 113.574 147.702 113.574C144.845 113.574 142.232 112.532 140.217 110.809C138.757 113.998 137.71 117.563 137.203 121.378C135.109 137.109 142.955 151.138 154.726 152.712C166.498 154.285 177.738 142.808 179.832 127.076C181.925 111.344 174.08 97.3156 162.308 95.7422Z',
]

/** Official Attie mark, sourced from attie.site/icon.svg. */
export const Attie = forwardRef<Svg, Props>(function Attie(props, ref) {
  const {size, style, ...rest} = useCommonSVGProps(props)

  return (
    <Svg
      {...rest}
      ref={ref}
      viewBox="0 0 254 254"
      width={size}
      height={size}
      style={[style]}>
      <Circle cx="127" cy="127" r="127" fill="#6338ff" />
      <G transform="translate(35.5 50.7) scale(0.72)">
        <Path d={paths[1]} fill="#fff" />
        <Path d={paths[2]} fill="#6338ff" />
        <Path d={paths[3]} fill="#6338ff" />
      </G>
    </Svg>
  )
}) as IconWithSvgMeta

Attie.svgPaths = paths
Attie.svgViewBox = '0 0 254 254'
Attie.svgStrokeWidth = 0

export const AttieCloud = forwardRef<Svg, Props>(
  function AttieCloud(props, ref) {
    const {fill, size, style, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox="0 0 254 254"
        width={size}
        height={size}
        style={[style]}>
        <G transform="translate(35.5 50.7) scale(0.72)">
          <Path d={paths[1]} fill={fill} />
          <Path d={paths[2]} fill="#6338ff" />
          <Path d={paths[3]} fill="#6338ff" />
        </G>
      </Svg>
    )
  },
)
