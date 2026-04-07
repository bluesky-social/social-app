import React, {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, type ButtonColor, ButtonIcon} from '#/components/Button'
import type * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {
  Bell2_Stroke2_Corner0_Rounded as BellIcon,
  Bell2Off_Stroke2_Corner0_Rounded as BellOffIcon,
} from '#/components/icons/Bell2'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {EditBig_Stroke2_Corner0_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import * as Layout from '#/components/Layout'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

/**
 * TODO This is just layout for now.
 */
export function MessagesConversationSettingsScreen() {
  const {gtTablet} = useBreakpoints()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align={gtTablet ? 'left' : 'platform'}>
          <Layout.Header.TitleText>
            <Trans>Group chat settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Center>
        <SettingsInner />
      </Layout.Center>
    </Layout.Screen>
  )
}

function SettingsInner() {
  return <SettingsHeading />
}

function SettingsHeading() {
  const t = useTheme()
  const {t: l} = useLingui()
  const editNamePrompt = Prompt.usePromptControl()
  const inviteLinkPrompt = Prompt.usePromptControl()
  const lockChatPrompt = Prompt.usePromptControl()

  const [groupName, setGroupName] = useState('Work in Progress')
  const [newGroupName, setNewGroupName] = useState('Work in Progress')

  const [isMuted, setIsMuted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  const handleToggleMute = () => {
    setIsMuted(prev => !prev)
  }

  const handlePromptName = () => {
    editNamePrompt.open()
  }

  const handleEditName = () => {
    setGroupName(newGroupName)
    editNamePrompt.close()
  }

  const handlePromptInviteLink = () => {
    inviteLinkPrompt.open()
  }

  const handleConfirmInviteLink = () => {
    inviteLinkPrompt.close()
  }

  const handlePromptLock = () => {
    lockChatPrompt.open()
  }

  const handleConfirmLock = () => {
    setIsLocked(true)
  }

  const handleUnlock = () => {
    setIsLocked(false)
  }

  return (
    <>
      <View
        style={[a.px_xl, a.py_4xl, a.border_b, t.atoms.border_contrast_low]}>
        <View style={[a.align_center, a.justify_center]}>
          <AvatarBubbles profiles={[1, 2, 3, 4]} />
        </View>
        <Text
          style={[
            a.text_2xl,
            a.font_bold,
            a.text_center,
            a.pt_lg,
            t.atoms.text,
          ]}>
          {groupName}
        </Text>
        <Text
          style={[
            a.text_sm,
            a.text_center,
            a.pt_xs,
            a.px_xl,
            t.atoms.text_contrast_high,
          ]}>
          Created April 2, 2026
        </Text>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_center,
            a.gap_2xl,
            a.pt_2xl,
          ]}>
          <SettingsButton
            color={isMuted ? 'negative_subtle' : 'secondary'}
            icon={isMuted ? BellOffIcon : BellIcon}
            label={
              isMuted ? l`Unmute this group chat` : l`Mute this group chat`
            }
            text={isMuted ? l`Muted` : l`Mute`}
            onPress={handleToggleMute}
          />
          <SettingsButton
            icon={EditIcon}
            label={l`Edit this group chat’s name`}
            text={l`Edit name`}
            onPress={handlePromptName}
          />
          <SettingsButton
            icon={ChainLinkIcon}
            label={l`Create an invite link for this group chat`}
            text={l`Invite link`}
            onPress={handlePromptInviteLink}
          />
          <SettingsButton
            color={isLocked ? 'negative_subtle' : 'secondary'}
            icon={LockIcon}
            label={
              isLocked ? l`Unlock this group chat` : l`Lock this group chat`
            }
            text={isLocked ? l`Locked` : l`Lock`}
            onPress={isLocked ? handleUnlock : handlePromptLock}
          />
        </View>
      </View>
      <EditNamePrompt
        control={editNamePrompt}
        value={newGroupName}
        onChangeText={setNewGroupName}
        onConfirm={handleEditName}
      />
      <InviteLinkPrompt
        control={inviteLinkPrompt}
        onConfirm={handleConfirmInviteLink}
      />
      <LockChatPrompt control={lockChatPrompt} onConfirm={handleConfirmLock} />
    </>
  )
}

type SettingsButtonProps = {
  color?: ButtonColor
  icon: React.ComponentType<SVGIconProps>
  label: string
  text: string
  onPress: () => void
}

function SettingsButton({
  color = 'secondary',
  icon,
  label,
  text,
  onPress,
}: SettingsButtonProps) {
  const t = useTheme()

  return (
    <View>
      <Button
        color={color}
        size="large"
        shape="round"
        label={label}
        onPress={onPress}>
        <ButtonIcon icon={icon} size="md" />
      </Button>
      <Text
        style={[
          a.text_2xs,
          a.font_medium,
          a.text_center,
          a.pt_xs,
          t.atoms.text,
        ]}>
        {text}
      </Text>
    </View>
  )
}

type EditNamePromptProps = {
  control: Dialog.DialogOuterProps['control']
  value: string
  onChangeText: (value: string) => void
  onConfirm: () => void
}

function EditNamePrompt({
  control,
  value,
  onChangeText,
  onConfirm,
}: EditNamePromptProps) {
  const {t: l} = useLingui()

  return (
    <Prompt.Outer control={control}>
      <>
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
                onSubmitEditing={onConfirm}
              />
            </TextField.Root>
          </View>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action
            cta={l`Save`}
            shouldCloseOnPress={false}
            onPress={onConfirm}
          />
          <Prompt.Cancel />
        </Prompt.Actions>
      </>
    </Prompt.Outer>
  )
}

type InviteLinkPromptProps = {
  control: Dialog.DialogOuterProps['control']
  onConfirm: () => void
}

function InviteLinkPrompt({control, onConfirm}: InviteLinkPromptProps) {
  const {t: l} = useLingui()

  return (
    <Prompt.Basic
      control={control}
      title={l`Invite link`}
      description={l`An invite link lets people join this group chat without being added directly. You control who can use the link and whether they need your approval. You can disable the link at any time. Your name, avatar, and the name of the group chat will be visible to everyone`}
      confirmButtonCta={l`Get started`}
      cancelButtonCta={l`Cancel`}
      onConfirm={onConfirm}
    />
  )
}

type LockChatPromptProps = {
  control: Dialog.DialogOuterProps['control']
  onConfirm: () => void
}

function LockChatPrompt({control, onConfirm}: LockChatPromptProps) {
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
