import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {useSupportPalette} from '../palette'
import {type SupportProvider} from '../types'
import {ProviderLogo} from './ProviderLogo'

/**
 * The provider's glyph in a tinted circle. The logo is the trust signal: it
 * tells you where the money is going before you tap.
 */
export function ProviderBadge({
  provider,
  size = 28,
}: {
  provider: SupportProvider | null
  size?: number
}) {
  const palette = useSupportPalette()
  const iconSize =
    size >= 52 ? 'xl' : size >= 40 ? 'lg' : size >= 28 ? 'sm' : 'xs'
  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_full,
        a.border,
        {
          width: size,
          height: size,
          backgroundColor: palette.tintBg,
          borderColor: palette.tintBorder,
        },
      ]}>
      <ProviderLogo
        provider={provider}
        size={iconSize}
        style={{color: palette.tintText}}
      />
    </View>
  )
}
