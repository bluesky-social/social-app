import Svg, {Path} from 'react-native-svg'

import {MU_LOGO} from '#/config/eurosky-logo'
import {type Props, useCommonSVGProps} from './common'
import {createSinglePathSVG} from './TEMPLATE'

/**
 * mu brand mark. For mu the symbol and the wordmark are one and the same, so
 * `Mark` and `Full` both render the shared wordmark glyph from
 * `#/config/eurosky-logo` (just at different aspect handling).
 */
export const Mark = createSinglePathSVG({
  path: MU_LOGO.path,
  viewBox: MU_LOGO.viewBox,
})

export function Full(
  props: Omit<Props, 'fill' | 'size' | 'height'> & {
    markFill?: Props['fill']
    textFill?: Props['fill']
  },
) {
  const {fill, size, style, gradient, ...rest} = useCommonSVGProps(props)
  const ratio = MU_LOGO.ratio

  return (
    <Svg
      fill="none"
      {...rest}
      viewBox={MU_LOGO.viewBox}
      width={size}
      height={size * ratio}
      style={[style]}>
      {gradient}
      <Path fill={props.markFill ?? props.textFill ?? fill} d={MU_LOGO.path} />
    </Svg>
  )
}
