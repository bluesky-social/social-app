import {type PathProps, type SvgProps} from 'react-native-svg'

import {useTheme} from '#/alf'
import {BrandLogo} from '#/components/icons/BrandLogo'

/**
 * mu has no separate symbol + wordmark lockup - the wordmark is the whole
 * brand mark - so this renders the same shared brand logo as <Logomark>.
 */
export function LogomarkWithType({
  fill,
  width,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const t = useTheme()
  const size = parseInt(`${width ?? 32}`)

  return <BrandLogo size={size} fill={fill || t.atoms.text.color} {...rest} />
}
