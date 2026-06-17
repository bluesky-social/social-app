import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {useTheme} from '#/alf'
import {BRAND_LOGO} from '#/config/brand-logo'

/**
 * mu has no separate symbol + wordmark lockup - the wordmark is the whole
 * brand mark - so this renders the same shared glyph as <Logomark>.
 */
const ratio = BRAND_LOGO.ratio

export function LogomarkWithType({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const t = useTheme()
  const size = parseInt(`${rest.width || 32}`)

  return (
    <Svg
      fill="none"
      viewBox={BRAND_LOGO.viewBox}
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <Path fill={fill || t.atoms.text.color} d={BRAND_LOGO.path} />
    </Svg>
  )
}
