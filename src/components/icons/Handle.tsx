import React from 'react'
import Svg, {Circle} from 'react-native-svg'

import {type Props, useCommonSVGProps} from './common'

export const HandleVertical = React.forwardRef<Svg, Props>(
  function LogoImpl(props, ref) {
    const {fill, size, style, gradient, ...rest} = useCommonSVGProps(props)
    return (
      <Svg
        fill={fill}
        {...rest}
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={[style]}>
        {gradient}
        <Circle cx="9" cy="12" r="1" />
        <Circle cx="9" cy="5" r="1" />
        <Circle cx="9" cy="19" r="1" />
        <Circle cx="15" cy="12" r="1" />
        <Circle cx="15" cy="5" r="1" />
        <Circle cx="15" cy="19" r="1" />
      </Svg>
    )
  },
)
