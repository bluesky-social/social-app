import {Modal, Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Robot_Filled_Corner2_Rounded as RobotIcon} from '#/components/icons/Robot'
import {Text} from '#/components/Typography'
import {navigate} from '#/Navigation'

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

export function BotAccountOwnAlert({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: (cb?: () => void) => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onClose()}
      accessibilityLabel={_(msg`Automated account`)}
      accessibilityViewIsModal>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Close`)}
        onPress={() => onClose()}
        style={[
          a.flex_1,
          a.justify_center,
          a.align_center,
          a.px_xl,
          {backgroundColor: 'rgba(0,0,0,0.5)'},
        ]}>
        <Pressable
          accessibilityRole="button"
          onPress={e => e.stopPropagation()}
          style={[
            t.atoms.bg,
            a.w_full,
            {borderRadius: 48},
            a.p_2xl,
            {maxWidth: 280},
          ]}>
          <View style={[a.align_center, a.gap_md]}>
            <View style={[t.atoms.shadow_sm]}>
              <RobotIcon width={48} fill={t.atoms.text_contrast_medium.color} />
            </View>

            <Text style={[a.text_md, a.text_center, a.py_sm]}>
              <Trans>
                You have marked this account as automated. You can remove it at
                any time from your account settings.
              </Trans>
            </Text>

            <Button
              label={_(msg`Okay`)}
              onPress={() => onClose()}
              color="primary"
              size="large"
              style={[a.w_full]}>
              <ButtonText>
                <Trans>Okay</Trans>
              </ButtonText>
            </Button>
            <Button
              label={_(msg`Open settings`)}
              onPress={() => {
                onClose(() => {
                  navigate('AutomationLabelSettings')
                })
              }}
              color="secondary"
              size="large"
              style={[a.w_full]}>
              <ButtonText>
                <Trans>Open settings</Trans>
              </ButtonText>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export function BotAccountOwnAlertWeb({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Dialog.Outer control={control} webOptions={{alignCenter: true}}>
      <Dialog.ScrollableInner
        label={_(msg`Automated account`)}
        style={web([{maxWidth: 320, borderRadius: 36}])}>
        <View style={[a.align_center, a.gap_2xl, a.py_md]}>
          <View style={[t.atoms.shadow_sm]}>
            <RobotIcon width={48} fill={t.atoms.text_contrast_medium.color} />
          </View>
          <Text style={[a.text_md, a.text_center]}>
            <Trans>
              You have marked this account as automated. You can remove it at
              any time from your account settings.
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
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
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
      <View style={[a.align_center, a.gap_2xl, a.py_md]}>
        <View style={[t.atoms.shadow_sm]}>
          <RobotIcon width={48} fill={t.atoms.text_contrast_medium.color} />
        </View>
        <Text style={[a.text_lg, a.text_center, a.font_semi_bold]}>
          <Trans>This account has been marked as automated by its owner</Trans>
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
