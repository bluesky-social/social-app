import React from 'react'
import Svg, {Path, Rect} from 'react-native-svg'

import {useCommonSVGProps, Props} from '#/components/icons/common'

export const TriangleExclamation_Stroke2_Corner2_Rounded = React.forwardRef<
  Svg,
  Props
>(function LogoImpl(props, ref) {
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
      <Path
        fill={fill}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.86 4.494a.995.995 0 0 0-1.72 0L4.14 16.502A.996.996 0 0 0 4.999 18h14.003a.996.996 0 0 0 .86-1.498L12.86 4.494ZM9.413 3.487c1.155-1.983 4.019-1.983 5.174 0l7.002 12.007C22.753 17.491 21.314 20 19.002 20H4.998c-2.312 0-3.751-2.509-2.587-4.506L9.413 3.487ZM12 8.019a1 1 0 0 1 1 1v2.994a1 1 0 1 1-2 0V9.02a1 1 0 0 1 1-1Z"
      />
      <Rect
        width="2.5"
        height="2.5"
        x="10.75"
        y="13.75"
        fill={fill}
        rx="1.25"
      />
    </Svg>
  )
})
