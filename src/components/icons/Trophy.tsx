import {forwardRef} from 'react'
import Svg, {Path} from 'react-native-svg'

import {type Props, useCommonSVGProps} from '#/components/icons/common'

// Multi-path, stroke-based icon (Lucide "trophy"), so it can't use
// createSinglePathSVG. Follows the same prop contract as the other icons.
const TROPHY_PATHS = [
  'M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978',
  'M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978',
  'M18 9h1.5a1 1 0 0 0 0-5H18',
  'M4 22h16',
  'M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z',
  'M6 9H4.5a1 1 0 0 1 0-5H6',
]

export const Trophy_Stroke2_Corner2_Rounded = forwardRef<Svg, Props>(
  function TrophyImpl(props, ref) {
    const {fill, size, style, ...rest} = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        // @ts-ignore it's fiiiiine
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={[style]}>
        {TROPHY_PATHS.map(d => (
          <Path
            key={d}
            d={d}
            stroke={fill}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    )
  },
)
