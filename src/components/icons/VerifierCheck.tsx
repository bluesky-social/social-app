import React from 'react'
import Svg, {Path} from 'react-native-svg'

import {type Props, useCommonSVGProps} from '#/components/icons/common'

export const VerifierCheck = React.forwardRef<Svg, Props>(function LogoImpl(
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
      <Path
        fill={fill}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.792 1.54a4.11 4.11 0 0 1 6.416 0 4.128 4.128 0 0 0 3.146 1.54c2.616.04 4.544 2.5 4 5.1a4.277 4.277 0 0 0 .777 3.462c1.6 2.104.912 5.17-1.427 6.36a4.21 4.21 0 0 0-2.177 2.774c-.62 2.584-3.408 3.948-5.781 2.83a4.092 4.092 0 0 0-3.492 0c-2.373 1.118-5.16-.246-5.78-2.83a4.21 4.21 0 0 0-2.178-2.775c-2.34-1.19-3.028-4.256-1.427-6.36a4.277 4.277 0 0 0 .776-3.46c-.543-2.602 1.385-5.06 4.001-5.1a4.128 4.128 0 0 0 3.146-1.54Z"
      />
      <Path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.659 8.399a1.361 1.361 0 0 1 0 1.925l-6.224 6.223a1.361 1.361 0 0 1-1.925 0L6.4 13.435a1.361 1.361 0 1 1 1.925-1.925l2.149 2.15 5.26-5.261a1.361 1.361 0 0 1 1.925 0Z"
      />
    </Svg>
  )
})
