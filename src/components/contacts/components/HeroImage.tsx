import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'

export function ContactsHeroImage() {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View
      style={[
        a.w_full,
        a.pl_3xl,
        a.pr_2xl,
        a.pt_4xl,
        a.pb_3xl,
        a.rounded_lg,
        {backgroundColor: t.palette.primary_50},
      ]}>
      <Image
        source={require('../../../../assets/images/find_friends_illustration.webp')}
        accessibilityIgnoresInvertColors
        style={[a.w_full, {aspectRatio: 1278 / 661}]}
        alt={l`An illustration depicting user avatars flowing from a contact book into the Bluesky app`}
        useAppleWebpCodec
      />
    </View>
  )
}
