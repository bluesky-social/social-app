import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useBreakpoints, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'

export const PasswordUpdatedForm = ({
  onPressNext,
}: {
  onPressNext: () => void
}) => {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()

  return (
    <FormContainer
      testID="passwordUpdatedForm"
      style={[a.gap_2xl, !gtMobile && a.mt_5xl]}>
      <Text style={[a.text_3xl, a.font_bold, a.text_center]}>
        <Trans>Password updated!</Trans>
      </Text>
      <Text style={[a.text_center, a.mx_auto, {maxWidth: '80%'}]}>
        <Trans>You can now sign in with your new password.</Trans>
      </Text>
      <View style={web([a.flex_row, a.justify_center])}>
        <Button
          onPress={onPressNext}
          label={_(msg`Close alert`)}
          accessibilityHint={_(msg`Closes password update alert`)}
          color="primary"
          size="large">
          <ButtonText>
            <Trans>Okay</Trans>
          </ButtonText>
        </Button>
      </View>
    </FormContainer>
  )
}
