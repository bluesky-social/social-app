import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Robot_Stroke2_Corner2_Rounded as RobotIcon} from '#/components/icons/Robot'
import {Text} from '#/components/Typography'

export function BotAccountInfoDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <BotAccountInfoDialogInner control={control} />
    </Dialog.Outer>
  )
}

function BotAccountInfoDialogInner({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Dialog.ScrollableInner label={_(msg`Automated account`)}>
      <View style={[a.align_center, a.gap_lg, a.py_md]}>
        <RobotIcon width={48} fill={t.atoms.text_contrast_medium.color} />
        <Text style={[a.text_lg, a.text_center, a.leading_snug]}>
          <Trans>
            This account has been marked as automated by its owner.
          </Trans>
        </Text>
        <Button
          label={_(msg`Okay`)}
          onPress={() => control.close()}
          color="primary"
          size="large"
          style={[a.w_full]}>
          <ButtonText>
            <Trans>Okay</Trans>
          </ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
