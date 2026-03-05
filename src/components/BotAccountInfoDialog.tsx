import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Robot_Filled_Corner2_Rounded as RobotIcon} from '#/components/icons/Robot'
import {Text} from '#/components/Typography'
import {navigate} from '#/Navigation'

export function BotAccountInfoDialog({
  control,
  isMe,
}: {
  control: Dialog.DialogControlProps
  isMe?: boolean
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <BotAccountInfoDialogInner control={control} isMe={isMe} />
    </Dialog.Outer>
  )
}

function BotAccountInfoDialogInner({
  control,
  isMe,
}: {
  control: Dialog.DialogControlProps
  isMe?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Dialog.ScrollableInner label={_(msg`Automated account`)}>
      <View style={[a.align_center, a.gap_2xl, a.py_md]}>
        <View style={[t.atoms.shadow_sm]}>
          <RobotIcon width={48} fill={t.atoms.text_contrast_medium.color} />
        </View>
        <Text style={[a.text_lg, a.text_center, a.font_semi_bold]}>
          {isMe ? (
            <Trans>
              You have marked this account as automated. You can remove it at
              any time from your account settings.
            </Trans>
          ) : (
            <Trans>
              This account has been marked as automated by its owner
            </Trans>
          )}
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
        {isMe && (
          <Button
            label={_(msg`Open settings`)}
            onPress={() => {
              control.close(() => {
                navigate('AutomationLabelSettings')
              })
            }}
            color="secondary"
            size="large"
            variant="ghost"
            style={[a.w_full]}>
            <ButtonText>
              <Trans>Open settings</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
