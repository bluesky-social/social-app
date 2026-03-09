import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Robot_Filled_Corner2_Rounded as RobotIcon} from '#/components/icons/Robot'
import {Text} from '#/components/Typography'
import {navigate} from '#/Navigation'
import type * as bsky from '#/types/bsky'

export function BotAccountAlert({
  control,
  profile,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()

  const isSelf = profile.did === currentAccount?.did
  const description = isSelf
    ? 'You have marked this account as automated. You can remove it at any time from your account settings.'
    : 'This account has been marked as automated by its owner'

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.ScrollableInner
        label={_(msg`Automated account`)}
        style={[web({maxWidth: 320})]}>
        <View style={[a.align_center, a.pb_md, a.shadow_sm]}>
          <RobotIcon width={48} fill={t.atoms.text_contrast_medium.color} />
        </View>
        <Text
          style={[
            a.leading_snug,
            a.text_center,
            a.pb_xl,
            a.text_md,
            t.atoms.text_contrast_high,
          ]}>
          <Trans>{description}</Trans>
        </Text>
        <View style={[a.w_full, a.gap_sm]}>
          <Button
            label={_(msg`Okay`)}
            onPress={() => control.close()}
            color="primary"
            size="large">
            <ButtonText>
              <Trans>Okay</Trans>
            </ButtonText>
          </Button>
          {isSelf ? (
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
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
