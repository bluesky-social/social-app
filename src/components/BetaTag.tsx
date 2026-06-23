import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

/**
 * mu fork: small "beta" badge shown under the logo on the logged-out entry
 * screens (the SplashScreen landing and the WelcomeModal) while the app is in
 * beta. Solid brand-pink pill to read as intentional next to the pink logo.
 */
export function BetaTag({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_full,
        a.px_sm,
        a.py_2xs,
        {backgroundColor: t.palette.primary_500},
        style,
      ]}>
      <Text
        style={[
          a.text_xs,
          a.font_bold,
          {color: 'white', textTransform: 'uppercase', letterSpacing: 1},
        ]}>
        <Trans comment="Badge indicating the app is in beta, shown under the logo">
          beta
        </Trans>
      </Text>
    </View>
  )
}
