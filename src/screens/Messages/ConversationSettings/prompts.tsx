import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import type * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as Prompt from '#/components/Prompt'

export function EditNamePrompt({
  control,
  value,
  onChangeText,
  onConfirm,
}: {
  control: Dialog.DialogOuterProps['control']
  value: string
  onChangeText: (value: string) => void
  onConfirm: () => void
}) {
  const {t: l} = useLingui()

  return (
    <Prompt.Outer control={control}>
      <Prompt.Content>
        <Prompt.TitleText>
          <Trans>Edit group name</Trans>
        </Prompt.TitleText>
        <View style={[a.my_sm]}>
          <TextField.Root isInvalid={false}>
            <TextField.Input
              label={l`Edit group name`}
              placeholder={l`Group name`}
              value={value}
              onChangeText={onChangeText}
              returnKeyType="done"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus
              onSubmitEditing={onConfirm}
            />
          </TextField.Root>
        </View>
      </Prompt.Content>
      <Prompt.Actions>
        <Prompt.Action cta={l`Save`} onPress={onConfirm} />
        <Prompt.Cancel />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}

export function LockChatPrompt({
  control,
  onConfirm,
}: {
  control: Dialog.DialogOuterProps['control']
  onConfirm: () => void
}) {
  const {t: l} = useLingui()

  return (
    <Prompt.Basic
      control={control}
      title={l`Lock group chat?`}
      description={l`Members can still read chat history but can’t send new messages.`}
      confirmButtonCta={l`Lock group chat`}
      cancelButtonCta={l`Cancel`}
      onConfirm={onConfirm}
    />
  )
}

export function LeaveChatPrompt({
  control,
  groupName,
  onConfirm,
}: {
  control: Dialog.DialogOuterProps['control']
  groupName: string
  onConfirm: () => void
}) {
  const {t: l} = useLingui()

  return (
    <Prompt.Basic
      control={control}
      title={l`Are you sure you want to leave ${groupName}?`}
      description={l`You won’t be able to rejoin unless you’re invited.`}
      confirmButtonCta={l`Leave group chat`}
      confirmButtonColor="negative"
      cancelButtonCta={l`Cancel`}
      onConfirm={onConfirm}
    />
  )
}

export function BlockMemberPrompt({
  control,
  onConfirm,
}: {
  control: Dialog.DialogOuterProps['control']
  onConfirm: () => void
}) {
  const {t: l} = useLingui()

  return (
    <Prompt.Basic
      control={control}
      title={l`Block account?`}
      description={l`Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.`}
      onConfirm={onConfirm}
      confirmButtonCta={l`Block`}
      confirmButtonColor="negative"
    />
  )
}
