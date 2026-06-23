import Svg, {Path} from 'react-native-svg'

import {BRAND_LOGO} from '#/config/brand-logo'
import {type Props, useCommonSVGProps} from './common'
import {createSinglePathSVG} from './TEMPLATE'

/**
 * mu brand mark. For mu the symbol and the wordmark are one and the same, so
 * `Mark` and `Full` both render the shared wordmark glyph from
 * `#/config/brand-logo` (just at different aspect handling).
 */
export const Mark = createSinglePathSVG({
  path: BRAND_LOGO.path,
  viewBox: BRAND_LOGO.viewBox,
})

export function Full(
  props: Omit<Props, 'fill' | 'size' | 'height'> & {
    markFill?: Props['fill']
    textFill?: Props['fill']
  },
) {
  const {fill, size, style, gradient, ...rest} = useCommonSVGProps(props)
  const ratio = BRAND_LOGO.ratio

  return (
    <Svg
      fill="none"
      {...rest}
      viewBox={BRAND_LOGO.viewBox}
      width={size}
      height={size * ratio}
      style={[style]}>
      {gradient}
      <Path
        fill={props.markFill ?? props.textFill ?? fill}
        d={BRAND_LOGO.path}
      />
    </Svg>
  )
}
