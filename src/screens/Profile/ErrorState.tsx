import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Text} from '#/components/Typography'

export function ErrorState({error}: {error: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  return (
    <View style={[a.px_xl]}>
      <CircleInfo width={48} style={[t.atoms.text_contrast_low]} />

      <Text style={[a.text_xl, a.font_semi_bold, a.pb_md, a.pt_xl]}>
        <Trans>Hmmmm, we couldn't load that moderation service.</Trans>
      </Text>
      <Text
        style={[
          a.text_md,
          a.leading_normal,
          a.pb_md,
          t.atoms.text_contrast_medium,
        ]}>
        <Trans>
          This moderation service is unavailable. See below for more details. If
          this issue persists, contact us.
        </Trans>
      </Text>
      <View
        style={[
          a.relative,
          a.py_md,
          a.px_lg,
          a.rounded_md,
          a.mb_2xl,
          t.atoms.bg_contrast_25,
        ]}>
        <Text style={[a.text_md, a.leading_normal]}>{error}</Text>
      </View>

      <View style={{flexDirection: 'row'}}>
        <Button
          size="small"
          color="secondary"
          variant="solid"
          label={_(msg`Go Back`)}
          accessibilityHint="Returns to previous page"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Go Back</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
