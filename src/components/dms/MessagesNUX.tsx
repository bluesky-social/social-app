import React, {useCallback, useEffect} from 'react'
import {View} from 'react-native'
import {ChatBskyActorDeclaration} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Message_Stroke2_Corner0_Rounded} from '#/components/icons/Message'
import {Text} from '#/components/Typography'

export function MessagesNUX() {
  const control = Dialog.useDialogControl()

  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({
    did: currentAccount!.did,
  })

  useEffect(() => {
    if (profile && typeof profile.associated?.chat === 'undefined') {
      control.open()
    }
  }, [profile, control])

  if (!profile) return null

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogInner chatDeclation={profile.associated?.chat} />
    </Dialog.Outer>
  )
}

function DialogInner({
  chatDeclation,
}: {
  chatDeclation?: ChatBskyActorDeclaration.Record
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const {mutate: updateDeclaration} = useUpdateActorDeclaration({
    onError: () => {
      Toast.show(_(msg`Failed to update settings`))
    },
  })

  const onSelectItem = useCallback(
    (keys: string[]) => {
      const key = keys[0]
      if (!key) return
      updateDeclaration(key as 'all' | 'none' | 'following')
    },
    [updateDeclaration],
  )

  useEffect(() => {
    if (!chatDeclation) {
      updateDeclaration('following')
    }
  }, [chatDeclation, updateDeclaration])

  return (
    <Dialog.ScrollableInner
      label={_(msg`Introducing Direct Messages`)}
      style={web({maxWidth: 500})}>
      <View style={a.gap_xl}>
        <View style={[a.align_center, a.my_lg]}>
          <Message_Stroke2_Corner0_Rounded width={64} />
          <Text style={[a.text_2xl, a.font_bold, a.text_center, a.mt_2xl]}>
            <Trans>Direct Messages are here!</Trans>
          </Text>
          <Text style={[a.text_md, a.text_center, a.mt_sm]}>
            <Trans>Privately chat with other users.</Trans>
          </Text>
        </View>
        <View
          style={[
            a.gap_xs,
            a.border,
            a.overflow_hidden,
            a.rounded_sm,
            t.atoms.border_contrast_low,
          ]}>
          <View style={[a.p_sm, a.border_b, t.atoms.border_contrast_low]}>
            <Text style={[a.text_sm, a.text_center]}>
              <Trans>Who can message you?</Trans>
            </Text>
          </View>
          <View style={[a.pb_md, a.pt_2xs, a.px_xs]}>
            <Toggle.Group
              label={_(msg`Who can message you?`)}
              type="radio"
              values={[chatDeclation?.allowIncoming ?? 'following']}
              onChange={onSelectItem}>
              <View>
                <Toggle.Item
                  name="all"
                  label={_(msg`Everyone`)}
                  style={[a.justify_between, a.p_sm, a.rounded_2xs]}>
                  <Toggle.LabelText>
                    <Trans>Everyone</Trans>
                  </Toggle.LabelText>
                  <Toggle.Radio />
                </Toggle.Item>
                <Toggle.Item
                  name="following"
                  label={_(msg`Users I follow`)}
                  style={[a.justify_between, a.p_sm, a.rounded_2xs]}>
                  <Toggle.LabelText>
                    <Trans>Users I follow</Trans>
                  </Toggle.LabelText>
                  <Toggle.Radio />
                </Toggle.Item>
                <Toggle.Item
                  name="none"
                  label={_(msg`No one`)}
                  style={[a.justify_between, a.p_sm, a.rounded_2xs]}>
                  <Toggle.LabelText>
                    <Trans>No one</Trans>
                  </Toggle.LabelText>
                  <Toggle.Radio />
                </Toggle.Item>
              </View>
            </Toggle.Group>
            <Text style={[a.mx_sm, a.mt_sm, a.text_xs]}>
              <Trans>You can change this at any time.</Trans>
            </Text>
          </View>
        </View>
        <Button
          label={_(msg`Start chatting`)}
          accessibilityHint={_(msg`Close modal`)}
          size="medium"
          color="primary"
          variant="solid"
          onPress={() => control.close()}>
          <ButtonText>Start chatting!</ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
