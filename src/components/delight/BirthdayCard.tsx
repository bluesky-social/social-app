import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {atoms as a, tokens} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {GradientFill} from '#/components/GradientFill'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {account, useStorage} from '#/storage'

export function BirthdayCard() {
  const {data: preferences} = usePreferencesQuery()
  const {currentAccount} = useSession()
  const {_} = useLingui()
  const [birthdayDismissYear, setBirthdayDismissYear] = useStorage(account, [
    currentAccount?.did ?? 'pwi',
    'birthdayDismissYear',
  ])

  const year = new Date().getUTCFullYear()

  if (
    !preferences ||
    !preferences.birthDate ||
    !isYourBirthday(preferences.birthDate) ||
    birthdayDismissYear === year
  ) {
    return null
  }

  return (
    <View style={[a.w_full, a.px_lg, a.py_2xs]}>
      <View
        style={[a.w_full, a.p_lg, a.rounded_sm, a.overflow_hidden, a.flex_row]}>
        <GradientFill gradient={tokens.gradients.midnight} />
        <Button
          onPress={() => setBirthdayDismissYear(year)}
          label={_(msg`Hide birthday card`)}
          variant="solid"
          size="small"
          shape="round"
          style={[a.bg_transparent, a.absolute, a.right_0, a.top_0]}>
          <ButtonIcon icon={XIcon} />
        </Button>
        <View style={[a.flex_1, a.justify_center, a.gap_xs, a.pb_xs]}>
          <Text
            style={[
              a.font_heavy,
              a.leading_snug,
              a.text_2xl,
              {color: 'white'},
            ]}>
            Happy Birthday!
          </Text>
          <Text
            style={[a.font_bold, a.leading_snug, a.text_sm, {color: 'white'}]}>
            Best wishes from all of us at the Bluesky team{' '}
            <HeartIcon fill="white" size="xs" />
          </Text>
        </View>
        <View style={[a.align_center, a.flex_1]}>
          <Image
            style={[{width: 80, height: 80}]}
            source={require('../../../assets/birthday-butterfly.png')}
            accessibilityIgnoresInvertColors
            contentFit="contain"
          />
        </View>
      </View>
    </View>
  )
}

function isYourBirthday(birthday: Date) {
  const today = new Date()
  return (
    today.getUTCDate() === birthday.getUTCDate() &&
    today.getUTCMonth() === birthday.getUTCMonth()
  )
}
