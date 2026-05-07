import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'

const ASSET_DARK = require('../../../../assets/images/giphy_attribution_dark.png')
const ASSET_LIGHT = require('../../../../assets/images/giphy_attribution_light.png')

const HEIGHT = 16
const ASPECT_RATIO = 200 / 28

export function PoweredByGiphy() {
  const t = useTheme()
  const {t: l} = useLingui()
  const isLight = t.name === 'light'
  return (
    <Image
      source={isLight ? ASSET_LIGHT : ASSET_DARK}
      contentFit="contain"
      style={[
        a.self_end,
        {
          height: HEIGHT,
          width: HEIGHT * ASPECT_RATIO,
        },
      ]}
      accessibilityLabel={l`Powered by GIPHY`}
      accessibilityHint=""
      accessibilityIgnoresInvertColors
    />
  )
}
