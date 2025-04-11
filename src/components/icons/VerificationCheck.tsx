import React from 'react'
import Svg, {Circle,Path} from 'react-native-svg'

import {type Props, useCommonSVGProps} from '#/components/icons/common'

export const VerificationCheck = React.forwardRef<Svg, Props>(function LogoImpl(
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
        d="M18.203 7.51a1.5 1.5 0 0 1 0 2.122l-6.857 6.857a1.5 1.5 0 0 1-2.121 0l-3.429-3.428a1.5 1.5 0 1 1 2.122-2.122l2.368 2.368 5.796-5.796a1.5 1.5 0 0 1 2.121 0Z"
      />
    </Svg>
  )
})
