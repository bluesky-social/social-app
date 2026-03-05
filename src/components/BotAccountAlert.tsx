import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import type * as Dialog from '#/components/Dialog'
import {Robot_Filled_Corner2_Rounded as RobotIcon} from '#/components/icons/Robot'
import * as Prompt from '#/components/Prompt'
import {navigate} from '#/Navigation'

export function BotAccountAlert({
  control,
  isOwn,
}: {
  control: Dialog.DialogControlProps
  isOwn: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  const description = isOwn
    ? 'You have marked this account as automated. You can remove it at any time from your account settings.'
    : 'This account has been marked as automated by its owner'

  return (
    <Prompt.Outer control={control} type="alert">
      <Prompt.Content>
        <View style={[a.align_center, a.pb_sm]}>
          <RobotIcon width={48} fill={t.atoms.text_contrast_medium.color} />
        </View>
        <Prompt.DescriptionText>
          <Trans>{description}</Trans>
        </Prompt.DescriptionText>
      </Prompt.Content>
      <Prompt.Actions>
        <Prompt.Action cta={_(msg`Okay`)} onPress={() => {}} color="primary" />
        {isOwn ? (
          <Button
            label={_(msg`Open settings`)}
            onPress={() => {
              control.close(() => {
                navigate('AutomationLabelSettings')
              })
            }}
            color="secondary"
            size="large">
            <ButtonText>
              <Trans>Open settings</Trans>
            </ButtonText>
          </Button>
        ) : null}
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
