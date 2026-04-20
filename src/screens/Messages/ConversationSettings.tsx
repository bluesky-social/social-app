import {useMemo, useState} from 'react'
import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'
import {moderateProfile} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {StackActions, useNavigation} from '@react-navigation/native'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/types'
import {ConvoProvider, useConvo} from '#/state/messages/convo'
import {ConvoStatus} from '#/state/messages/convo/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useEditGroupName} from '#/state/queries/messages/edit-group-name'
import {useGetConvoAvailabilityQuery} from '#/state/queries/messages/get-convo-availability'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {useMuteConvo} from '#/state/queries/messages/mute-conversation'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {List} from '#/view/com/util/List'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, type ButtonColor, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {AddMembersFlow} from '#/components/dms/AddMembersFlow'
import {type ConvoWithDetails, parseConvoView} from '#/components/dms/util'
import {Error} from '#/components/Error'
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
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
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
      profile: Shadow<bsky.profile.AnyProfileView>
      status: 'owner' | 'member' | 'invited'
    }

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversationSettings'
>

/**
 * TODO This is just layout for now.
 */
export function MessagesConversationSettingsScreen({route}: Props) {
  const {gtTablet} = useBreakpoints()

  const convoId = route.params.conversation

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
      <ConvoProvider key={convoId} convoId={convoId}>
        <SettingsInner />
      </ConvoProvider>
    </Layout.Screen>
  )
}

function keyExtractor(item: Item) {
  return item.type === 'CHAT_MEMBER' ? item.profile.did : item.type
}

function SettingsInner() {
  const {t: l} = useLingui()

  const initialNumToRender = useInitialNumToRender({minItemHeight: 68})
  const bottomBarOffset = useBottomBarOffset()

  const convoState = useConvo()
  const {currentAccount} = useSession()

  const convo = convoState.convo
    ? parseConvoView(convoState.convo, currentAccount?.did)
    : null
  const primaryMember = convo?.primaryMember
  const isOwner = !!primaryMember && primaryMember.did === currentAccount?.did

  const data: bsky.profile.AnyProfileView[] = convo?.members ?? []
  const invites: string[] = []

  const items = [
    {
      type: 'MEMBERS_AND_REQUESTS',
    },
    {
      type: 'ADD_MEMBERS_LINK',
    },
    ...[...data]
      .sort((a, b) => {
        const aIsOwner = a.did === primaryMember?.did
        const bIsOwner = b.did === primaryMember?.did
        const aIsSelf = a.did === currentAccount?.did
        const bIsSelf = b.did === currentAccount?.did
        if (aIsOwner !== bIsOwner) return aIsOwner ? -1 : 1
        if (aIsSelf !== bIsSelf) return aIsSelf ? -1 : 1
        return 0
      })
      .map(profile => ({
        type: 'CHAT_MEMBER',
        profile,
        status:
          primaryMember?.did === profile.did
            ? 'owner'
            : invites.includes(profile.did)
              ? 'invited'
              : 'member',
      })),
  ]

  function renderItem({item}: {item: Item}) {
    switch (item.type) {
      case 'MEMBERS_AND_REQUESTS':
        return (
          <MembersAndRequests
            memberCount={data.length}
            requestCount={5}
            isOwner={isOwner}
          />
        )
      case 'ADD_MEMBERS_LINK':
        return <AddMembersLink isOwner={isOwner} />
      case 'CHAT_MEMBER':
        return (
          <Member
            profile={item.profile}
            status={item.status}
            isOwner={isOwner}
          />
        )
      default:
        return null
    }
  }

  if (convoState.status === ConvoStatus.Error) {
    return (
      <>
        <Error
          title={l`Something went wrong`}
          message={l`We couldn’t load this conversation’s settings`}
          onRetry={() => convoState.error.retry()}
          sideBorders={false}
        />
      </>
    )
  }

  return (
    <List
      data={items}
      contentContainerStyle={{paddingBottom: bottomBarOffset + ROW_SPACING}}
      desktopFixedHeight
      initialNumToRender={initialNumToRender}
      keyExtractor={keyExtractor}
      ListHeaderComponent={
        convo ? (
          <SettingsHeader convo={convo} isOwner={isOwner} />
        ) : (
          <SettingsHeaderPlaceholder />
        )
      }
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
  isOwner,
}: {
  memberCount: number
  requestCount: number
  isOwner: boolean
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
      {isOwner && requestCount > 0 ? (
        <InlineLinkText
          label={l`View incoming group chat requests`}
          style={[a.text_sm, a.text_right, a.font_semi_bold]}
          to="#">
          {l`${plural(requestCount, {
            one: '# request',
            other: '# requests',
          })}`}
        </InlineLinkText>
      ) : null}
    </View>
  )
}

function AddMembersLink({isOwner}: {isOwner: boolean}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const addMembersControl = Dialog.useDialogControl()

  if (!isOwner) {
    return null
  }

  return (
    <>
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
            ]}
            onPress={() => addMembersControl.open()}>
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
                      <PlusIcon
                        style={[t.atoms.text_contrast_high]}
                        size="sm"
                      />
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

      <Dialog.Outer
        control={addMembersControl}
        testID="addChatMembersDialog"
        nativeOptions={{fullHeight: true}}>
        <Dialog.Handle />
        <AddMembersFlow
          title={l`Add members`}
          onAddMembers={(_dids: string[]) => {
            // TODO Add members here
            addMembersControl.close()
          }}
        />
      </Dialog.Outer>
    </>
  )
}

function Member({
  profile,
  status,
  isOwner,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  status: 'owner' | 'member' | 'invited'
  isOwner: boolean
}) {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {t: l} = useLingui()

  const {currentAccount} = useSession()
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

  let statusBadge: React.ReactNode | null = null
  if (currentAccount?.did === profile.did) {
    switch (status) {
      case 'owner':
        statusBadge = <StatusBadge label={l`Admin`} />
        break
    }
  } else {
    statusBadge = (
      <MemberMenu profile={profile} type={status} isOwner={isOwner} />
    )
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
            </View>
          </View>
          <View>{statusBadge}</View>
        </View>
      </Pressable>
    </SubtleHoverWrapper>
  )
}

function StatusBadge({
  label,
  style,
}: {
  label: string
  style?: StyleProp<ViewStyle>
}) {
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
        style,
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
  isOwner,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  type: 'owner' | 'member' | 'invited'
  isOwner: boolean
}) {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()

  const requireEmailVerification = useRequireEmailVerification()

  const blockMemberPrompt = Prompt.usePromptControl()

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
  const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)

  const messageMember = () => {
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

  const handleMessageMember = requireEmailVerification(messageMember, {
    instructions: [
      <Trans key="message">
        Before you can message another user, you must first verify your email.
      </Trans>,
    ],
  })

  const handleBlockMember = async () => {
    if (profile.viewer?.blocking) {
      try {
        await queueUnblock()
        Toast.show(l({message: 'Account unblocked', context: 'toast'}))
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          ax.logger.error('Failed to unblock account', {message: e})
          Toast.show(l`There was an issue! ${e.toString()}`, {
            type: 'error',
          })
        }
      }
    } else {
      try {
        await queueBlock()
        Toast.show(l({message: 'Account blocked', context: 'toast'}))
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          ax.logger.error('Failed to block account', {message: e})
          Toast.show(l`There was an issue! ${e.toString()}`, {
            type: 'error',
          })
        }
      }
    }
  }

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
    <>
      <Menu.Root>
        <Menu.Trigger label={l`Open chat member options for ${displayName}`}>
          {({props, state, control: menuControl}) =>
            type === 'owner' || type === 'invited' ? (
              <StatusButton
                {...props}
                label={type === 'owner' ? l`Admin` : l`Invited`}
                style={[
                  state.hovered || state.pressed || menuControl.isOpen
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
                  state.hovered || state.pressed || menuControl.isOpen
                    ? {
                        backgroundColor: t.palette.contrast_0,
                      }
                    : null,
                ]}>
                <EllipsisIcon
                  style={[t.atoms.text_contrast_medium]}
                  size="md"
                />
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
            <Menu.Item
              label={l`Message ${displayName}`}
              onPress={handleMessageMember}>
              <Menu.ItemText>
                <Trans context="action">Message</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={MessageIcon} />
            </Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          <Menu.Group>
            {type === 'owner' || type === 'member' ? (
              <Menu.Item
                label={
                  profile.viewer?.blocking
                    ? l`Unblock ${displayName}`
                    : l`Block ${displayName}`
                }
                onPress={() => blockMemberPrompt.open()}>
                <Menu.ItemText>
                  <Trans>Block</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={PersonXIcon} />
              </Menu.Item>
            ) : null}
            {isOwner ? (
              <Menu.Item
                label={l`Remove ${displayName} from this group chat`}
                onPress={() => {}}>
                <Menu.ItemText>
                  <Trans>Remove from chat</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ArrowBoxLeftIcon} />
              </Menu.Item>
            ) : null}
            {isOwner && type === 'invited' ? (
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
      <BlockMemberPrompt
        control={blockMemberPrompt}
        onConfirm={() => void handleBlockMember()}
      />
    </>
  )
}

function SettingsHeader({
  convo,
  isOwner,
}: {
  convo: ConvoWithDetails
  isOwner: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const navigation = useNavigation<NavigationProp>()

  const groupName = convo.kind === 'group' ? convo.details.name : ''
  const [newGroupName, setNewGroupName] = useState(groupName)

  const [isLocked, setIsLocked] = useState(false)

  const {mutate: editGroupName} = useEditGroupName(convo.view.id, {
    onError: e => {
      setNewGroupName(groupName)
      logger.error('Failed to edit group chat name', {message: e})
      Toast.show(l`Failed to edit group chat name`, {
        type: 'error',
      })
    },
  })

  const {mutate: muteConvo} = useMuteConvo(convo.view.id, {
    onSuccess: data => {
      if (data.convo.muted) {
        Toast.show(l({message: 'Group chat muted', context: 'toast'}))
      } else {
        Toast.show(l({message: 'Group chat unmuted', context: 'toast'}))
      }
    },
    onError: e => {
      logger.error('Failed to mute group chat', {message: e})
      Toast.show(l`Failed to mute group chat`, {
        type: 'error',
      })
    },
  })

  const {mutate: leaveConvo} = useLeaveConvo(convo.view.id, {
    onMutate: () => {
      navigation.dispatch(StackActions.pop(2))
    },
    onError: e => {
      logger.error('Failed to leave group chat', {message: e})
      Toast.show(l({message: 'Failed to leave group chat', context: 'toast'}), {
        type: 'error',
      })
    },
  })

  const editNamePrompt = Prompt.usePromptControl()
  const inviteLinkPrompt = Prompt.usePromptControl()
  const lockChatPrompt = Prompt.usePromptControl()
  const leaveChatPrompt = Prompt.usePromptControl()

  const handleToggleMute = () => {
    muteConvo({mute: !convo.view.muted})
  }

  const handleLeaveChat = () => {
    leaveChatPrompt.open()
  }

  const handleReportChat = () => {}

  const handlePromptName = () => {
    editNamePrompt.open()
  }

  const handleEditName = () => {
    editGroupName({name: newGroupName})
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
          <AvatarBubbles profiles={convo.members} />
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
            color={convo.view.muted ? 'negative_subtle' : 'secondary'}
            icon={convo.view.muted ? BellOffIcon : BellIcon}
            label={
              convo.view.muted
                ? l`Unmute this group chat`
                : l`Mute this group chat`
            }
            text={convo.view.muted ? l`Muted` : l`Mute`}
            onPress={handleToggleMute}
          />
          {isOwner ? (
            <SettingsButton
              icon={EditIcon}
              label={l`Edit this group chat’s name`}
              text={l`Edit name`}
              onPress={handlePromptName}
            />
          ) : null}
          <SettingsButton
            icon={ChainLinkIcon}
            label={l`Create an invite link for this group chat`}
            text={l`Invite link`}
            onPress={handlePromptInviteLink}
          />
          {isOwner ? (
            <SettingsButton
              color={isLocked ? 'negative_subtle' : 'secondary'}
              icon={LockIcon}
              label={
                isLocked ? l`Unlock this group chat` : l`Lock this group chat`
              }
              text={isLocked ? l`Locked` : l`Lock`}
              onPress={isLocked ? handleUnlock : handlePromptLock}
            />
          ) : null}
          {isOwner ? null : (
            <SettingsButton
              color="secondary"
              icon={FlagIcon}
              label={l`Report this group chat`}
              text={l`Report`}
              onPress={handleReportChat}
            />
          )}
          {isOwner ? null : (
            <SettingsButton
              color="secondary"
              icon={ArrowBoxLeftIcon}
              label={l`Leave this group chat`}
              text={l`Leave`}
              onPress={handleLeaveChat}
            />
          )}
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
      <LeaveChatPrompt
        control={leaveChatPrompt}
        groupName={groupName}
        onConfirm={leaveConvo}
      />
    </>
  )
}

function SettingsHeaderPlaceholder() {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View style={[a.px_xl, a.py_4xl, a.border_b, t.atoms.border_contrast_low]}>
      <View style={[a.align_center, a.justify_center]}>
        <AvatarBubbles profiles={[]} />
      </View>
      <Text
        style={[a.text_2xl, a.font_bold, a.text_center, a.pt_lg, t.atoms.text]}>
        {l`…`}
      </Text>
      <Text
        style={[
          a.text_sm,
          a.text_center,
          a.pt_xs,
          a.px_xl,
          t.atoms.text_contrast_high,
        ]}>
        <Trans>…</Trans>
      </Text>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.gap_2xl,
          a.pt_2xl,
        ]}>
        <SettingsButtonPlaceholder />
        <SettingsButtonPlaceholder />
        <SettingsButtonPlaceholder />
        <SettingsButtonPlaceholder />
      </View>
    </View>
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
        numberOfLines={1}
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

function SettingsButtonPlaceholder() {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View>
      <Button color="secondary" size="large" shape="round" label={l`Loading…`}>
        <ButtonIcon icon={EllipsisIcon} size="md" />
      </Button>
      <Text
        numberOfLines={1}
        style={[
          a.text_2xs,
          a.font_medium,
          a.text_center,
          a.pt_xs,
          t.atoms.text,
        ]}>
        {l`…`}
      </Text>
    </View>
  )
}

function EditNamePrompt({
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
                autoFocus
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
      description={l`An invite link lets people join this group chat without being added directly. You control who can use the link and whether they need your approval. You can disable the link at any time. Your name, avatar, and the name of the group chat will be visible to everyone.`}
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

function LeaveChatPrompt({
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

function BlockMemberPrompt({
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
