import React from 'react'
import Svg, {Path} from 'react-native-svg'

import {Props, useCommonSVGProps} from '#/components/icons/common'

export function createSinglePathSVG({path}: {path: string}) {
  return React.forwardRef<Svg, Props>(function LogoImpl(props, ref) {
    const {fill, size, style, gradient, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={[style]}>
        {gradient}
        <Path fill={fill} fillRule="evenodd" clipRule="evenodd" d={path} />
      </Svg>
    )
  })
}

export function createMultiPathSVG({paths}: {paths: string[]}) {
  return React.forwardRef<Svg, Props>(function LogoImpl(props, ref) {
    const {fill, size, style, gradient, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={[style]}>
        {gradient}
        {paths.map((path, i) => (
          <Path
            key={i}
            fill={fill}
            fillRule="evenodd"
            clipRule="evenodd"
            d={path}
          />
        ))}
      </Svg>
    )
  })
}
