import {useMemo, useState} from 'react'
import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'
import {moderateProfile} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetConvoAvailabilityQuery} from '#/state/queries/messages/get-convo-availability'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import {List} from '#/view/com/util/List'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, type ButtonColor, ButtonIcon} from '#/components/Button'
import type * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon} from '#/components/icons/ArrowBoxLeft'
import {
  Bell2_Stroke2_Corner0_Rounded as BellIcon,
  Bell2Off_Stroke2_Corner0_Rounded as BellOffIcon,
} from '#/components/icons/Bell2'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon} from '#/components/icons/Chevron'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {EditBig_Stroke2_Corner0_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {
  Person_Stroke2_Corner2_Rounded as PersonIcon,
  PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import * as Menu from '#/components/Menu'
import {type TriggerChildProps} from '#/components/Menu/types'
import * as Prompt from '#/components/Prompt'
import {SubtleHover} from '#/components/SubtleHover'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'

const MEMBER_LIMIT = 50
const ROW_SPACING = 10

type Item =
  | {
      type: 'MEMBERS_AND_REQUESTS'
    }
  | {
      type: 'ADD_MEMBERS_LINK'
    }
  | {
      type: 'CHAT_MEMBER'
      profile: bsky.profile.AnyProfileView
      status: 'admin' | 'member' | 'invited'
    }

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
      <SettingsInner />
    </Layout.Screen>
  )
}

function keyExtractor(item: Item) {
  return item.type === 'CHAT_MEMBER' ? item.profile.did : item.type
}

function SettingsInner() {
  const initialNumToRender = useInitialNumToRender({minItemHeight: 68})
  const bottomBarOffset = useBottomBarOffset()

  const data: bsky.profile.AnyProfileView[] = []
  const invites: string[] = []

  const items = [
    {
      type: 'MEMBERS_AND_REQUESTS',
    },
    {
      type: 'ADD_MEMBERS_LINK',
    },
    ...data.map((profile, index) => ({
      type: 'CHAT_MEMBER',
      profile,
      status:
        index === 0
          ? 'admin'
          : invites.includes(profile.did)
            ? 'invited'
            : 'member',
    })),
  ]

  function renderItem({item}: {item: Item}) {
    switch (item.type) {
      case 'MEMBERS_AND_REQUESTS':
        return <MembersAndRequests memberCount={data.length} requestCount={5} />
      case 'ADD_MEMBERS_LINK':
        return <AddMembersLink />
      case 'CHAT_MEMBER':
        return <Member profile={item.profile} status={item.status} />
      default:
        return null
    }
  }

  return (
    <List
      data={items}
      contentContainerStyle={
        IS_NATIVE && {paddingBottom: bottomBarOffset + ROW_SPACING}
      }
      desktopFixedHeight
      initialNumToRender={initialNumToRender}
      keyExtractor={keyExtractor}
      ListHeaderComponent={<SettingsHeader profiles={data} />}
      renderItem={renderItem}
      sideBorders={false}
      windowSize={11}
      onEndReachedThreshold={IS_NATIVE ? 1.5 : 0}
    />
  )
}

function MembersAndRequests({
  memberCount,
  requestCount,
}: {
  memberCount: number
  requestCount: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View style={[a.flex_row, a.justify_between, a.mx_xl, a.mt_lg, a.mb_sm]}>
      <View style={[a.flex_row, a.align_center]}>
        <Text style={[a.text_lg, a.font_semi_bold, t.atoms.text]}>
          <Trans>Members</Trans>{' '}
        </Text>
        <Text
          style={[
            a.text_xs,
            a.font_medium,
            {color: t.palette.contrast_500},
          ]}>{l`${memberCount}/${MEMBER_LIMIT}`}</Text>
      </View>
      <InlineLinkText
        label={l`View incoming group chat requests`}
        style={[a.text_sm, a.text_right, a.font_semi_bold]}
        to="#">
        {l`${plural(requestCount, {
          one: '# request',
          other: '# requests',
        })}`}
      </InlineLinkText>
    </View>
  )
}

function AddMembersLink() {
  const t = useTheme()

  return (
    <SubtleHoverWrapper>
      <View
        style={[
          a.mx_xl,
          {
            marginTop: ROW_SPACING,
            marginBottom: ROW_SPACING,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          style={({pressed}) => [
            a.flex_row,
            a.align_center,
            a.justify_between,
            pressed && web({outline: 'none'}),
          ]}>
          {({pressed}) => (
            <>
              <View>
                <View style={[a.flex_row, a.align_center]}>
                  <View
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.justify_center,
                      a.p_lg,
                      a.rounded_full,
                      pressed
                        ? t.atoms.bg_contrast_100
                        : t.atoms.bg_contrast_50,
                      {
                        height: 48,
                        width: 48,
                      },
                    ]}>
                    <PlusIcon style={[t.atoms.text_contrast_high]} size="sm" />
                  </View>
                  <Text
                    style={[
                      a.text_md,
                      a.font_semi_bold,
                      a.pl_sm,
                      t.atoms.text,
                    ]}>
                    <Trans>Add members</Trans>
                  </Text>
                </View>
              </View>
              <ChevronIcon style={[t.atoms.text_contrast_medium]} size="md" />
            </>
          )}
        </Pressable>
      </View>
    </SubtleHoverWrapper>
  )
}

function Member({
  profile,
  status,
}: {
  profile: bsky.profile.AnyProfileView
  status: 'admin' | 'member' | 'invited'
}) {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {t: l} = useLingui()

  const moderationOpts = useModerationOpts()
  const moderation = useMemo(
    () =>
      moderationOpts ? moderateProfile(profile, moderationOpts) : undefined,
    [profile, moderationOpts],
  )

  if (!moderation) return null

  const invitedByDisplayName = 'Darrin Loeliger'

  const isDeletedAccount = profile.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? l`Deleted Account`
    : sanitizeDisplayName(
        profile.displayName || profile.handle,
        moderation.ui('displayName'),
      )

  let invitedBy: React.ReactNode | null = (
    <Text style={[a.text_xs, {color: t.palette.contrast_500}]}>
      {l`Added by ${invitedByDisplayName}`}
    </Text>
  )
  let statusBadge: React.ReactNode | null = (
    <MemberMenu profile={profile} type="member" />
  )
  switch (status) {
    case 'admin':
      invitedBy = null
      statusBadge = <StatusBadge label={l`Admin`} />
      break
    case 'invited':
      invitedBy = (
        <Text style={[a.text_xs, {color: t.palette.contrast_500}]}>
          {l`Invited by ${invitedByDisplayName}`}
        </Text>
      )
      statusBadge = <MemberMenu profile={profile} type="invited" />
      break
  }

  return (
    <SubtleHoverWrapper>
      <Pressable
        accessibilityRole="button"
        style={[
          a.mx_xl,
          {
            marginTop: ROW_SPACING,
            marginBottom: ROW_SPACING,
          },
        ]}
        onPress={() => {
          navigation.navigate('Profile', {name: profile.did})
        }}>
        <View style={[a.flex_row, a.align_center, a.justify_between]}>
          <View style={[a.flex_row, a.align_center]}>
            <PreviewableUserAvatar
              profile={profile}
              size={48}
              moderation={moderation.ui('avatar')}
            />
            <View style={[a.mx_sm]}>
              <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                {displayName}
              </Text>
              <Text
                style={[
                  a.text_xs,
                  {color: t.palette.contrast_500},
                  web(a.pt_2xs),
                ]}>
                {sanitizeHandle(profile.handle, '@')}
              </Text>
              {invitedBy ? (
                <Text
                  style={[
                    a.text_xs,
                    {color: t.palette.contrast_500},
                    web(a.pt_2xs),
                  ]}>
                  {invitedBy}
                </Text>
              ) : null}
            </View>
          </View>
          <View>{statusBadge}</View>
        </View>
      </Pressable>
    </SubtleHoverWrapper>
  )
}

function StatusBadge({label}: {label: string}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_xs,
        t.atoms.bg_contrast_50,
        {
          paddingTop: 3,
          paddingBottom: 3,
          paddingLeft: 6,
          paddingRight: 6,
        },
      ]}>
      <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
    </View>
  )
}

function StatusButton({
  label,
  style,
  ...rest
}: {
  label: string
  style?: StyleProp<ViewStyle>
} & TriggerChildProps['props']) {
  const t = useTheme()

  return (
    <Pressable
      style={[
        a.rounded_xs,
        t.atoms.bg_contrast_50,
        {
          paddingTop: 3,
          paddingBottom: 3,
          paddingLeft: 6,
          paddingRight: 6,
        },
        style,
      ]}
      {...rest}>
      <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
    </Pressable>
  )
}

function MemberMenu({
  profile,
  type,
}: {
  profile: bsky.profile.AnyProfileView
  type: 'member' | 'invited'
}) {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const requireEmailVerification = useRequireEmailVerification()

  const {data: convoAvailability} = useGetConvoAvailabilityQuery(profile.did)
  const {mutate: initiateConvo} = useGetConvoForMembers({
    onSuccess: ({convo}) => {
      ax.metric('chat:open', {logContext: 'ProfileHeader'})
      navigation.navigate('MessagesConversation', {conversation: convo.id})
    },
    onError: () => {
      Toast.show(l`Failed to create conversation`)
    },
  })

  const onPress = () => {
    if (!convoAvailability?.canChat) {
      return
    }

    if (convoAvailability.convo) {
      ax.metric('chat:open', {logContext: 'ProfileHeader'})
      navigation.navigate('MessagesConversation', {
        conversation: convoAvailability.convo.id,
      })
    } else {
      ax.metric('chat:create', {logContext: 'ProfileHeader'})
      initiateConvo([profile.did])
    }
  }

  const wrappedOnPress = requireEmailVerification(onPress, {
    instructions: [
      <Trans key="message">
        Before you can message another user, you must first verify your email.
      </Trans>,
    ],
  })

  const moderationOpts = useModerationOpts()
  const moderation = useMemo(
    () =>
      moderationOpts ? moderateProfile(profile, moderationOpts) : undefined,
    [profile, moderationOpts],
  )

  if (!moderation) return null

  const isDeletedAccount = profile.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? l`Deleted Account`
    : sanitizeDisplayName(
        profile.displayName || profile.handle,
        moderation.ui('displayName'),
      )

  return (
    <Menu.Root>
      <Menu.Trigger label={l`Open chat member options for ${displayName}`}>
        {({props, state}) =>
          type === 'invited' ? (
            <StatusButton
              {...props}
              label={l`Invited`}
              style={[
                state.hovered
                  ? {
                      backgroundColor: t.palette.contrast_0,
                    }
                  : null,
              ]}
            />
          ) : (
            <Pressable
              {...props}
              style={[
                a.rounded_full,
                a.p_sm,
                state.hovered
                  ? {
                      backgroundColor: t.palette.contrast_0,
                    }
                  : null,
              ]}>
              <EllipsisIcon style={[t.atoms.text_contrast_medium]} size="md" />
            </Pressable>
          )
        }
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.Group>
          <Menu.Item
            label={l`View ${displayName}’s profile`}
            onPress={() => {
              navigation.navigate('Profile', {name: profile.did})
            }}>
            <Menu.ItemText>
              <Trans>Go to profile</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={PersonIcon} />
          </Menu.Item>
          <Menu.Item label={l`Message ${displayName}`} onPress={wrappedOnPress}>
            <Menu.ItemText>
              <Trans>Message</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={MessageIcon} />
          </Menu.Item>
        </Menu.Group>
        <Menu.Divider />
        <Menu.Group>
          {type === 'member' ? (
            <>
              <Menu.Item label={l`Block ${displayName}`} onPress={() => {}}>
                <Menu.ItemText>
                  <Trans>Block</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={PersonXIcon} />
              </Menu.Item>
              <Menu.Item
                label={l`Remove ${displayName} from this group chat`}
                onPress={() => {}}>
                <Menu.ItemText>
                  <Trans>Remove from chat</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ArrowBoxLeftIcon} />
              </Menu.Item>
            </>
          ) : null}
          {type === 'invited' ? (
            <Menu.Item
              label={l`Uninvite ${displayName} from this group chat`}
              onPress={() => {}}>
              <Menu.ItemText>
                <Trans>Uninvite</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={ArrowBoxLeftIcon} />
            </Menu.Item>
          ) : null}
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}

function SettingsHeader({profiles}: {profiles: bsky.profile.AnyProfileView[]}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const editNamePrompt = Prompt.usePromptControl()
  const inviteLinkPrompt = Prompt.usePromptControl()
  const lockChatPrompt = Prompt.usePromptControl()

  const [groupName, setGroupName] = useState('Work in Progress')
  const [newGroupName, setNewGroupName] = useState(groupName)

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
          <AvatarBubbles profiles={profiles} />
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

function SettingsButton({
  color = 'secondary',
  icon,
  label,
  text,
  onPress,
}: {
  color?: ButtonColor
  icon: React.ComponentType<SVGIconProps>
  label: string
  text: string
  onPress: () => void
}) {
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

function InviteLinkPrompt({
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
      title={l`Invite link`}
      description={l`An invite link lets people join this group chat without being added directly. You control who can use the link and whether they need your approval. You can disable the link at any time. Your name, avatar, and the name of the group chat will be visible to everyone`}
      confirmButtonCta={l`Get started`}
      cancelButtonCta={l`Cancel`}
      onConfirm={onConfirm}
    />
  )
}

function LockChatPrompt({
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

function SubtleHoverWrapper({children}: React.PropsWithChildren<unknown>) {
  const {
    state: hover,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  return (
    <View
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}
      style={a.pointer}>
      <SubtleHover hover={hover} />
      {children}
    </View>
  )
}
