import React from 'react'
import Svg, {Circle, Rect} from 'react-native-svg'

import {type Props, useCommonSVGProps} from '#/components/icons/common'

export const Circle_And_Square_Stroke1_Corner0_Rounded_Filled =
  React.forwardRef<Svg, Props>(function CircleAndSquareImpl(props, ref) {
    const {fill, size, style, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox="0 0 65 64"
        width={size}
        height={size}
        style={[style]}>
        <Rect
          x="2.15859"
          y="15.9566"
          width="34.4409"
          height="34.4409"
          rx="4.65333"
          transform="rotate(-16.3846 2.15859 15.9566)"
          stroke={fill}
          strokeWidth="2"
          fill="none"
        />
        <Circle
          cx="44.1195"
          cy="39.0366"
          r="18.9633"
          stroke={fill}
          strokeWidth="2"
          fill="none"
        />
      </Svg>
    )
  })
