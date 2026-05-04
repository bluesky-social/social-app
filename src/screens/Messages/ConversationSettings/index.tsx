import {useState} from 'react'
import {View} from 'react-native'
import {ChatBskyActorDefs, ChatBskyConvoDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {ConvoProvider, isConvoActive, useConvo} from '#/state/messages/convo'
import {ConvoStatus} from '#/state/messages/convo/types'
import {useEditGroupChatName} from '#/state/queries/messages/edit-group-chat-name'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {useListConvoMembersQuery} from '#/state/queries/messages/list-convo-members'
import {useListJoinRequestsQuery} from '#/state/queries/messages/list-join-requests'
import {useLockConvo} from '#/state/queries/messages/lock-conversation'
import {useMuteConvo} from '#/state/queries/messages/mute-conversation'
import {useSession} from '#/state/session'
import {List} from '#/view/com/util/List'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, type ButtonColor, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {
  type ConvoWithDetails,
  type GroupConvoMember,
} from '#/components/dms/util'
import {Error} from '#/components/Error'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon} from '#/components/icons/ArrowBoxLeft'
import {
  Bell2_Stroke2_Corner0_Rounded as BellIcon,
  Bell2Off_Stroke2_Corner0_Rounded as BellOffIcon,
} from '#/components/icons/Bell2'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {EditBig_Stroke2_Corner2_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'
import {InviteLinkDialog} from '../components/InviteLinkDialog'
import {AddMembersLink} from './AddMembersLink'
import {Member, MemberPlaceholder} from './Member'
import {MembersAndRequests} from './MembersAndRequests'
import {EditNamePrompt, LeaveChatPrompt, LockChatPrompt} from './prompts'

type Item =
  | {type: 'MEMBERS_AND_REQUESTS'; key: string}
  | {type: 'ADD_MEMBERS_LINK'; key: string}
  | {
      type: 'CHAT_MEMBER'
      key: string
      profile: GroupConvoMember
      status: 'owner' | 'standard' | 'invited'
    }
  | {
      type: 'CHAT_MEMBER_PLACEHOLDER'
      key: string
    }

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversationSettings'
>

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

function SettingsInner() {
  const {t: l} = useLingui()
  const convoState = useConvo()
  const navigation = useNavigation<NavigationProp>()

  if (convoState.status === ConvoStatus.Error) {
    return (
      <Error
        title={l`Something went wrong`}
        message={l`We couldn’t load this conversation’s settings`}
        onRetry={() => convoState.error.retry()}
        sideBorders={false}
      />
    )
  }

  if (!isConvoActive(convoState)) {
    return (
      <View style={[a.flex_1, a.align_center, a.justify_center]}>
        <Loader size="xl" />
      </View>
    )
  }

  if (convoState.convo?.kind !== 'group') {
    return (
      <Error
        title={l`Wrong kind of conversation`}
        message={l`This screen is only available for group conversations.`}
        onGoBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation.replace('Messages', {animation: 'pop'})
          }
        }}
      />
    )
  }

  return <GroupSettings convo={convoState.convo} />
}

function keyExtractor(item: Item) {
  return item.key
}

function isGroupMember(
  member: ChatBskyActorDefs.ProfileViewBasic,
): member is GroupConvoMember {
  // Kind is missing when the account has been deleted.
  return (
    member.kind === undefined ||
    bsky.dangerousIsType<ChatBskyActorDefs.GroupConvoMember>(
      member.kind,
      ChatBskyActorDefs.isGroupConvoMember,
    )
  )
}

function GroupSettings({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
}) {
  const initialNumToRender = useInitialNumToRender({minItemHeight: 68})
  const bottomBarOffset = useBottomBarOffset()

  const {currentAccount} = useSession()

  const primaryMember = convo.primaryMember
  const isOwner = primaryMember.did === currentAccount?.did

  const {data: memberListData = [], isPending} = useListConvoMembersQuery({
    convoId: convo.view.id,
    placeholderData: convo.members,
  })

  // TODO Need this data in order to populate this array. -dsb
  const invites: string[] = []

  const {data: joinRequestsData, hasNextPage: hasMoreRequests} =
    useListJoinRequestsQuery({
      convoId: convo.view.id,
      enabled: isOwner,
    })
  const requestCount =
    joinRequestsData?.pages.reduce(
      (sum, page) => sum + page.requests.length,
      0,
    ) ?? 0

  const items: Item[] = [
    {
      type: 'MEMBERS_AND_REQUESTS',
      key: 'members-and-requests',
    },
    ...(isOwner
      ? [{type: 'ADD_MEMBERS_LINK', key: 'add-members-link'} as const]
      : []),
  ]
  if (isPending) {
    // should never be pending if we correctly set the query cache data
    items.push(
      ...Array.from({length: 5}, (_, i) => ({
        type: 'CHAT_MEMBER_PLACEHOLDER' as const,
        key: `chat-member-placeholder-${i}`,
      })),
    )
  } else {
    items.push(
      ...memberListData
        .filter(isGroupMember)
        .sort((a, b) => {
          const aIsOwner = a.did === primaryMember.did
          const bIsOwner = b.did === primaryMember.did
          const aIsSelf = a.did === currentAccount?.did
          const bIsSelf = b.did === currentAccount?.did
          if (aIsOwner !== bIsOwner) return aIsOwner ? -1 : 1
          if (aIsSelf !== bIsSelf) return aIsSelf ? -1 : 1
          return 0
        })
        .map(
          (profile): Item => ({
            type: 'CHAT_MEMBER',
            key: profile.did,
            profile,
            status:
              primaryMember.did === profile.did
                ? 'owner'
                : invites.includes(profile.did)
                  ? 'invited'
                  : 'standard',
          }),
        ),
    )
  }

  function renderItem({item}: {item: Item}) {
    switch (item.type) {
      case 'MEMBERS_AND_REQUESTS':
        return (
          <MembersAndRequests
            memberCount={convo.details.memberCount}
            requestCount={requestCount}
            hasMoreRequests={!!hasMoreRequests}
            isOwner={isOwner}
          />
        )
      case 'ADD_MEMBERS_LINK':
        return <AddMembersLink convo={convo} />
      case 'CHAT_MEMBER':
        return (
          <Member
            convo={convo}
            profile={item.profile}
            status={item.status}
            isOwner={isOwner}
          />
        )
      case 'CHAT_MEMBER_PLACEHOLDER':
        return <MemberPlaceholder />
      default:
        return null
    }
  }

  return (
    <List
      data={items}
      contentContainerStyle={{
        paddingBottom: bottomBarOffset + a.pb_xl.paddingBottom,
      }}
      desktopFixedHeight
      initialNumToRender={initialNumToRender}
      keyExtractor={keyExtractor}
      ListHeaderComponent={<SettingsHeader convo={convo} isOwner={isOwner} />}
      renderItem={renderItem}
      sideBorders={false}
      windowSize={11}
    />
  )
}

function SettingsHeader({
  convo,
  isOwner,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
  isOwner: boolean
}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()

  const navigation = useNavigation<NavigationProp>()

  const groupName = convo.details.name
  const [newGroupName, setNewGroupName] = useState(groupName)

  const lockStatus = convo.details.lockStatus

  const {joinLink} = convo.details
  const isJoinLinkEnabled = isOwner || joinLink?.enabledStatus === 'enabled'

  // TODO Enable this once the feature is working end-to-end. -dsb
  const isReportLinkEnabled = false

  const {mutate: editGroupName, isPending: isEditingName} =
    useEditGroupChatName(convo.view.id, {
      onSuccess: () => {
        Toast.show(l({message: 'Group chat name updated', context: 'toast'}))
      },
      onError: e => {
        setNewGroupName(groupName)
        logger.error('Failed to edit group chat name', {message: e})
        Toast.show(l`Failed to edit group chat name`, {type: 'error'})
      },
    })

  const {mutate: muteConvo, isPending: isMuting} = useMuteConvo(convo.view.id, {
    onSuccess: data => {
      if (data.convo.muted) {
        Toast.show(l({message: 'Group chat muted', context: 'toast'}))
      } else {
        Toast.show(l({message: 'Group chat unmuted', context: 'toast'}))
      }
    },
    onError: e => {
      logger.error('Failed to mute group chat', {message: e})
      Toast.show(l`Failed to mute group chat`, {type: 'error'})
    },
  })

  const {mutate: leaveConvo, isPending: isLeaving} = useLeaveConvo(
    convo.view.id,
    {
      onSuccess: () => {
        navigation.replace('Messages', {animation: 'pop'})
      },
      onError: e => {
        logger.error('Failed to leave group chat', {message: e})
        Toast.show(
          l({message: 'Failed to leave group chat', context: 'toast'}),
          {type: 'error'},
        )
      },
    },
  )

  const {mutate: lockConvo, isPending: isLocking} = useLockConvo(
    convo.view.id,
    {
      onSuccess: data => {
        if (!ChatBskyConvoDefs.isGroupConvo(data.convo.kind)) return
        if (data.convo.kind.lockStatus === 'locked') {
          Toast.show(l({message: 'Group chat locked', context: 'toast'}))
        } else {
          Toast.show(l({message: 'Group chat unlocked', context: 'toast'}))
        }
      },
      onError: (e, {lock}) => {
        if (lock) {
          logger.error('Failed to lock group chat', {message: e})
          Toast.show(l`Failed to lock group chat`, {type: 'error'})
        } else {
          logger.error('Failed to unlock group chat', {message: e})
          Toast.show(l`Failed to unlock group chat`, {type: 'error'})
        }
      },
    },
  )

  const inviteLinkDialog = Dialog.useDialogControl()
  const editNamePrompt = Prompt.usePromptControl()
  const lockChatPrompt = Prompt.usePromptControl()
  const leaveChatPrompt = Prompt.usePromptControl()

  const handleToggleMute = () => {
    muteConvo({mute: !convo.view.muted})
  }

  // TODO Need to implement this when the backend is ready. -dsb
  const handleReportChat = () => {}

  const handlePromptName = () => {
    setNewGroupName(groupName)
    editNamePrompt.open()
  }

  const handleEditName = () => {
    editGroupName({name: newGroupName})
  }

  const handleConfirmLock = () => {
    lockConvo({lock: true})
  }

  const handleUnlock = () => {
    lockConvo({lock: false})
  }

  const createdAt = new Date(convo.details.createdAt)

  const canLockGroupChat = isOwner && lockStatus !== 'locked-permanently'

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
          <Trans>
            Created{' '}
            {i18n.date(createdAt, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Trans>
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
            disabled={isMuting}
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
              disabled={isEditingName}
              icon={EditIcon}
              label={l`Edit this group chat’s name`}
              text={l`Edit name`}
              onPress={handlePromptName}
            />
          ) : null}
          {isJoinLinkEnabled ? (
            <SettingsButton
              disabled={lockStatus !== 'unlocked'}
              icon={ChainLinkIcon}
              label={
                isOwner
                  ? l`Create or modify an invite link for this group chat`
                  : l`View the invite link for this group chat`
              }
              text={l`Invite link`}
              onPress={inviteLinkDialog.open}
            />
          ) : null}
          {canLockGroupChat ? (
            <SettingsButton
              color={lockStatus === 'locked' ? 'negative_subtle' : 'secondary'}
              disabled={isLocking}
              icon={LockIcon}
              label={
                lockStatus === 'locked'
                  ? l`Unlock this group chat`
                  : l`Lock this group chat`
              }
              text={lockStatus === 'locked' ? l`Locked` : l`Lock`}
              onPress={
                lockStatus === 'locked' ? handleUnlock : lockChatPrompt.open
              }
            />
          ) : null}
          {!isOwner && isReportLinkEnabled && (
            <SettingsButton
              icon={FlagIcon}
              label={l`Report this group chat`}
              text={l`Report`}
              onPress={handleReportChat}
            />
          )}
          {!isOwner && (
            <SettingsButton
              disabled={isLeaving}
              icon={ArrowBoxLeftIcon}
              label={l`Leave this group chat`}
              text={l`Leave`}
              onPress={leaveChatPrompt.open}
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
      <InviteLinkDialog
        convo={convo}
        control={inviteLinkDialog}
        isOwner={isOwner}
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

function SettingsButton({
  color = 'secondary',
  disabled,
  icon,
  label,
  text,
  onPress,
}: {
  color?: ButtonColor
  disabled?: boolean
  icon: React.ComponentType<SVGIconProps>
  label: string
  text: string
  onPress: () => void
}) {
  const t = useTheme()

  return (
    <View style={[a.align_center]}>
      <Button
        color={color}
        disabled={disabled}
        size="large"
        shape="round"
        label={label}
        onPress={onPress}
        style={[
          {
            width: 48,
            height: 48,
          },
        ]}>
        <ButtonIcon icon={icon} size="md" />
      </Button>
      <Text
        numberOfLines={1}
        style={[
          a.text_xs,
          a.font_medium,
          a.text_center,
          a.pt_xs,
          t.atoms.text_contrast_medium,
        ]}>
        {text}
      </Text>
    </View>
  )
}
