import {type SvgProps} from 'react-native-svg'

import {useTheme} from '#/alf'
import {BrandLogo} from '#/components/icons/BrandLogo'

/**
 * The brand logo for hero + marketing surfaces (welcome modal, signup card,
 * splash). Renders the `hero` role when the brand ships one (e.g. mu's
 * dimensional wordmark, whose two tones follow the accent via `theme:` tokens),
 * otherwise falls back to the flat mark filled with the accent colour.
 */
export function LogoHero({width, ...rest}: SvgProps) {
  const t = useTheme()
  const size = parseInt(`${width ?? 140}`)

  return (
    <BrandLogo
      variant="hero"
      size={size}
      fill={t.palette.primary_500}
      {...rest}
    />
  )
}
