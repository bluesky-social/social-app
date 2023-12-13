import React from 'react'
import Svg, {Path, SvgProps, PathProps} from 'react-native-svg'

import {colors} from '#/lib/styles'

export function Logo({fill, ...rest}: {fill?: PathProps['fill']} & SvgProps) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 64 64"
      {...rest}
      width={rest.width || 32}
      height={rest.height || rest.width || 32}>
      <Path
        fill={fill || colors.blue3}
        d="M13.873 4.308C21.21 10.564 29.103 23.25 32 30.057c2.898-6.807 10.79-19.493 18.127-25.75C55.421-.205 64-3.698 64 7.416c0 2.22-1.12 18.647-1.778 21.314-2.284 9.272-10.609 11.637-18.014 10.206 12.944 2.502 16.236 10.789 9.125 19.076-13.505 15.74-19.41-3.949-20.924-8.994-.277-.924-.407-1.357-.409-.99-.002-.367-.132.066-.41.99-1.512 5.045-7.418 24.734-20.923 8.994-7.111-8.287-3.819-16.574 9.125-19.076C12.387 40.366 4.062 38 1.778 28.729 1.12 26.062 0 9.635 0 7.415 0-3.699 8.579-.206 13.873 4.308Z"
      />
    </Svg>
  )
}
