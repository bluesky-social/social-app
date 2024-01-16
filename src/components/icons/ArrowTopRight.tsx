import React from 'react'
import Svg, {Path} from 'react-native-svg'

import {useCommonSVGProps, Props} from '#/components/icons/common'

export const ArrowTopRight_Stroke2_Corner0_Rounded = React.forwardRef(
  function LogoImpl(props: Props, ref) {
    const {fill, size, style, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        // @ts-ignore it's fiiiiine
        ref={ref}
        viewBox="0 0 24 24"
        style={[{width: size}, style]}>
        <Path
          fill={fill}
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M8 6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0V8.414l-9.793 9.793a1 1 0 0 1-1.414-1.414L15.586 7H9a1 1 0 0 1-1-1Z"
        />
      </Svg>
    )
  },
)
