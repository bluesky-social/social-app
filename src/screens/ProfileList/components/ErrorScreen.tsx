import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function ErrorScreen({error}: {error: React.ReactNode}) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const onPressBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }

  return (
    <View style={[a.px_xl, a.py_md, a.gap_md]}>
      <Text style={[a.text_4xl, a.font_bold]}>
        <Trans>Could not load list</Trans>
      </Text>
      <Text style={[a.text_md, t.atoms.text_contrast_high, a.leading_snug]}>
        {error}
      </Text>

      <View style={[a.flex_row, a.mt_lg]}>
        <Button
          label={_(msg`Go back`)}
          accessibilityHint={_(msg`Returns to previous page`)}
          onPress={onPressBack}
          size="small"
          color="secondary">
          <ButtonText>
            <Trans>Go back</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
