import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {MAX_GROUP_NAME_GRAPHEME_LENGTH} from '#/lib/constants'
import {isOverMaxGraphemeCount} from '#/lib/strings/helpers'
import {atoms as a, useTheme} from '#/alf'
import type * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

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
  const t = useTheme()
  const {t: l} = useLingui()

  const nameTooLong = isOverMaxGraphemeCount({
    text: value,
    maxCount: MAX_GROUP_NAME_GRAPHEME_LENGTH,
  })

  return (
    <Prompt.Outer control={control}>
      <>
        <Prompt.Content>
          <Prompt.TitleText>
            <Trans>Edit group name</Trans>
          </Prompt.TitleText>
          <View style={[a.my_sm]}>
            <TextField.Root isInvalid={nameTooLong}>
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
                onSubmitEditing={nameTooLong ? undefined : onConfirm}
              />
            </TextField.Root>
            {nameTooLong ? (
              <Text
                style={[
                  a.text_sm,
                  a.mt_xs,
                  a.font_semi_bold,
                  {color: t.palette.negative_400},
                ]}>
                <Trans>
                  Group name is too long. The maximum number of characters is{' '}
                  {MAX_GROUP_NAME_GRAPHEME_LENGTH}.
                </Trans>
              </Text>
            ) : null}
          </View>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action
            cta={l`Save`}
            onPress={onConfirm}
            disabled={nameTooLong}
          />
          <Prompt.Cancel />
        </Prompt.Actions>
      </>
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

export function LeaveAndLockChatPrompt({
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
      description={l`Leaving this chat will lock it permanently and you will not be able to rejoin.`}
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
