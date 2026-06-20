import {type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {BrandLogo} from '#/components/icons/BrandLogo'

/**
 * mu brand wordmark. The mark and the wordmark are the same glyph for mu, so
 * this renders the shared brand logo. Defaults to the theme text colour (ink on
 * light, cotton on dark); callers can override.
 */
export function Logotype({
  fill,
  width,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  const size = parseInt(`${width ?? 32}`)

  return <BrandLogo size={size} fill={fill || pal.text.color} {...rest} />
}
