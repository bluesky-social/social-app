import React from 'react'
import Svg, {Circle, Path} from 'react-native-svg'

import {type Props, useCommonSVGProps} from '#/components/icons/common'

export const VerifiedCheck = React.forwardRef<Svg, Props>(function LogoImpl(
  props,
  ref,
) {
  const {fill, size, style, ...rest} = useCommonSVGProps(props)

  return (
    <Svg
      fill="none"
      {...rest}
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={[style]}>
      <Circle cx="12" cy="12" r="12" fill={fill} />
      <Path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.311 7.421a1.437 1.437 0 0 1 0 2.033l-6.571 6.571a1.437 1.437 0 0 1-2.033 0L6.42 12.74a1.438 1.438 0 0 1 2.033-2.033l2.27 2.269 5.554-5.555a1.437 1.437 0 0 1 2.033 0Z"
      />
    </Svg>
  )
})
