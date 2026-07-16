import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as InfoIcon} from '#/components/icons/CircleInfo'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

/**
 * Web fallback - QR scanning relies on the device camera and is native-only by
 * design. The route is registered on all platforms, so a web user reaching
 * /invite/scan via a direct URL gets this message instead of the native
 * camera UI.
 */
export function InviteScannerScreen() {
  const {t: l} = useLingui()
  const t = useTheme()
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>{l`Scan QR code`}</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <View
        style={[a.flex_1, a.align_center, a.justify_center, a.p_xl, a.gap_md]}>
        <InfoIcon size="xl" fill={t.atoms.text_contrast_medium.color} />
        <Text style={[a.text_xl, a.font_bold, a.text_center]}>
          {l`Not available on this platform`}
        </Text>
        <Text
          style={[
            a.text_md,
            a.text_center,
            t.atoms.text_contrast_medium,
            {maxWidth: 320},
          ]}>
          {l`Please use the Blacksky mobile app to scan a QR code.`}
        </Text>
      </View>
    </Layout.Screen>
  )
}
