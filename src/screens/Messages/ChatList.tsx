import {useCallback, useEffect, useMemo, useState} from 'react'
import {View} from 'react-native'
import {useAnimatedRef} from 'react-native-reanimated'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {useAppState} from '#/lib/appState'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {type MessagesTabNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {listenSoftReset} from '#/state/events'
import {MESSAGE_SCREEN_POLL_INTERVAL} from '#/state/messages/convo/const'
import {useMessagesEventBus} from '#/state/messages/events'
import {useLeftConvos} from '#/state/queries/messages/leave-conversation'
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List, type ListRef} from '#/view/com/util/List'
import {ChatListLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {type DialogControlProps, useDialogControl} from '#/components/Dialog'
import {NewChat} from '#/components/dms/dialogs/NewChatDialog'
import {useRefreshOnFocus} from '#/components/hooks/useRefreshOnFocus'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotate'
import {BubbleSmile_Stroke2_Corner2_Rounded_Large as BubbleSmileIcon} from '#/components/icons/Bubble'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Inbox_Stroke2_Corner2_Rounded_Large as InboxLargeIcon} from '#/components/icons/Inbox'
import {
  MessagePlus_Stroke2_Corner0_Rounded as MessagePlusIcon,
  MessagePlus_Stroke2_Corner0_Rounded as NewChatIcon,
} from '#/components/icons/Message'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {IS_NATIVE} from '#/env'
import {ChatListItem} from './components/ChatListItem'
import {InboxRequests} from './components/InboxRequests'
import {useIsWithinSplitView} from './components/splitView/context'

type ListItem = {
  type: 'CONVERSATION'
  conversation: ChatBskyConvoDefs.ConvoView
  selected: boolean
}

function renderItem({item}: {item: ListItem}) {
  return <ChatListItem convo={item.conversation} selected={item.selected} />
}

function keyExtractor(item: ListItem) {
  return item.conversation.id
}

type Props = NativeStackScreenProps<MessagesTabNavigatorParams, 'Messages'>

export function MessagesScreen(props: Props) {
  const {t: l} = useLingui()
  const aaCopy = useAgeAssuranceCopy()
  const aa = useAgeAssurance()

  return (
    <AgeRestrictedScreen
      screenTitle={l`Chats`}
      infoText={aaCopy.chatsInfoText}
      rightHeaderSlot={
        aa.flags.chatDisabled ? null : (
          <Link
            to="/messages/settings"
            label={l`Chat settings`}
            size="small"
            color="secondary">
            <ButtonText>
              <Trans>Chat settings</Trans>
            </ButtonText>
          </Link>
        )
      }>
      <MessagesScreenInner {...props} />
    </AgeRestrictedScreen>
  )
}

export function MessagesScreenInner({navigation, route}: Props) {
  const {isWithinSplitView} = useIsWithinSplitView()
  const {t: l} = useLingui()
  const t = useTheme()
  const newChatControl = useDialogControl()
  const pushToConversation = route.params?.pushToConversation

  // Whenever we have `pushToConversation` set, it means we pressed a notification for a chat without being on
  // this tab. We should immediately push to the conversation after pressing the notification.
  // After we push, reset with `setParams` so that this effect will fire next time we press a notification, even if
  // the conversation is the same as before
  useEffect(() => {
    if (pushToConversation) {
      navigation.navigate('MessagesConversation', {
        conversation: pushToConversation,
      })
      navigation.setParams({pushToConversation: undefined})
    }
  }, [navigation, pushToConversation])

  // Request the poll interval to be 10s (or whatever the MESSAGE_SCREEN_POLL_INTERVAL is set to in the future)
  // but only when the screen is active
  const messagesBus = useMessagesEventBus()
  const state = useAppState()
  const isActive = state === 'active'
  useFocusEffect(
    useCallback(() => {
      if (isActive) {
        const unsub = messagesBus.requestPollInterval(
          MESSAGE_SCREEN_POLL_INTERVAL,
        )
        return () => unsub()
      }
    }, [messagesBus, isActive]),
  )

  const onNewChat = useCallback(
    (conversation: string) =>
      navigation.navigate('MessagesConversation', {conversation}),
    [navigation],
  )

  if (isWithinSplitView) {
    return (
      <>
        <EmptyState
          message={l`Say hi to someone`}
          icon={BubbleSmileIcon}
          textStyle={t.atoms.text}
          iconColor={t.atoms.text.color}
          iconSize="4xl"
          button={{
            label: l`New chat`,
            text: l`New chat`,
            onPress: newChatControl.open,
            size: 'small',
            color: 'primary',
            icon: MessagePlusIcon,
          }}
          style={[a.h_full, a.justify_center, a.pb_5xl]}
        />
        <NewChat onNewChat={onNewChat} control={newChatControl} />
      </>
    )
  }

  return (
    <Layout.Screen testID="messagesScreen">
      <Header newChatControl={newChatControl} />
      <ChatList newChatControl={newChatControl} />
      <NewChat onNewChat={onNewChat} control={newChatControl} />
    </Layout.Screen>
  )
}

export function ChatList({
  selectedChat,
  newChatControl,
}: {
  selectedChat?: string
  newChatControl: DialogControlProps
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const scrollElRef: ListRef = useAnimatedRef()
  const {isWithinSplitView} = useIsWithinSplitView()

  const openChatControl = useCallback(() => {
    newChatControl.open()
  }, [newChatControl])

  const requireEmailVerification = useRequireEmailVerification()
  const wrappedOpenChatControl = requireEmailVerification(openChatControl, {
    instructions: [
      <Trans key="new-chat">
        Before you can message another user, you must first verify your email.
      </Trans>,
    ],
  })

  const initialNumToRender = useInitialNumToRender({minItemHeight: 80})
  const [isPTRing, setIsPTRing] = useState(false)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useListConvosQuery({status: 'accepted'})

  const {refetch: refetchInbox} = useListConvosQuery({
    status: 'request',
  })

  useRefreshOnFocus(refetch)
  useRefreshOnFocus(refetchInbox)

  const leftConvos = useLeftConvos()

  const conversations = useMemo(() => {
    if (data?.pages) {
      const conversations = data.pages
        .flatMap(page => page.convos)
        // filter out convos that are actively being left
        .filter(convo => !leftConvos.includes(convo.id))

      return conversations.map(
        convo =>
          ({
            type: 'CONVERSATION',
            conversation: convo,
            selected: convo.id === selectedChat,
          }) as const,
      ) satisfies ListItem[]
    }
    return []
  }, [data, leftConvos, selectedChat])

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await Promise.all([refetch(), refetchInbox()])
    } catch (err) {
      logger.error('Failed to refresh conversations', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, refetchInbox, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more conversations', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const onSoftReset = useCallback(async () => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: 0,
    })
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh conversations', {message: err})
    }
  }, [scrollElRef, refetch])

  const isScreenFocused = useIsFocused()
  useEffect(() => {
    if (!isScreenFocused) {
      return
    }
    return listenSoftReset(() => void onSoftReset())
  }, [onSoftReset, isScreenFocused])

  if (conversations.length === 0) {
    return (
      <Layout.Center style={web({minHeight: '100%'})}>
        {isLoading ? (
          <ChatListLoadingPlaceholder />
        ) : (
          <>
            {isError ? (
              <>
                <View style={[a.pt_3xl, a.align_center]}>
                  <CircleInfoIcon
                    width={48}
                    fill={t.atoms.text_contrast_low.color}
                  />
                  <Text
                    style={[a.pt_md, a.pb_sm, a.text_2xl, a.font_semi_bold]}>
                    <Trans>Whoops!</Trans>
                  </Text>
                  <Text
                    style={[
                      a.text_md,
                      a.pb_xl,
                      a.text_center,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                      {maxWidth: 360},
                    ]}>
                    {cleanError(error) || l`Failed to load conversations`}
                  </Text>

                  <Button
                    label={l`Reload conversations`}
                    size="small"
                    color="secondary_inverted"
                    onPress={() => void refetch()}>
                    <ButtonText>
                      <Trans>Retry</Trans>
                    </ButtonText>
                    <ButtonIcon icon={RetryIcon} />
                  </Button>
                </View>
              </>
            ) : isWithinSplitView ? (
              <EmptyState
                message={l`Inbox empty`}
                icon={InboxLargeIcon}
                iconSize="4xl"
                textStyle={t.atoms.text}
                iconColor={t.atoms.text.color}
                style={web([a.h_full, a.justify_center, {paddingBottom: 120}])}
              />
            ) : (
              <EmptyState
                message={l`No chats yet`}
                icon={InboxLargeIcon}
                iconSize="4xl"
                textStyle={t.atoms.text}
                iconColor={t.atoms.text.color}
                button={{
                  label: l`New chat`,
                  text: l`New chat`,
                  onPress: wrappedOpenChatControl,
                  size: 'small',
                  color: 'primary',
                  icon: MessagePlusIcon,
                }}
                style={web([a.h_full, a.justify_center, {paddingBottom: 120}])}
              />
            )}
          </>
        )}
      </Layout.Center>
    )
  }

  return (
    <List
      ref={scrollElRef}
      data={conversations}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      onEndReached={() => void onEndReached()}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanError(error)}
          onRetry={fetchNextPage}
          style={{borderColor: 'transparent'}}
          hasNextPage={hasNextPage}
        />
      }
      onEndReachedThreshold={IS_NATIVE ? 1.5 : 0}
      initialNumToRender={initialNumToRender}
      windowSize={11}
      desktopFixedHeight
      sideBorders={false}
      disableFullWindowScroll={isWithinSplitView}
      style={
        isWithinSplitView && [
          a.w_full,
          web({
            scrollbarWidth: 'thin',
            scrollbarColor: `${t.palette.contrast_100} transparent`,
          }),
        ]
      }
      contentContainerStyle={isWithinSplitView && a.py_sm}
    />
  )
}

export function Header({newChatControl}: {newChatControl: DialogControlProps}) {
  const {t: l} = useLingui()
  const {gtMobile} = useBreakpoints()
  const requireEmailVerification = useRequireEmailVerification()
  const leftConvos = useLeftConvos()

  const {data: unreadInboxData, hasNextPage: hasMoreRequests} =
    useListConvosQuery({
      status: 'request',
      readState: 'unread',
    })

  const inboxAllConvos =
    unreadInboxData?.pages
      .flatMap(page => page.convos)
      .filter(
        convo =>
          !leftConvos.includes(convo.id) &&
          !convo.muted &&
          convo.members.every(member => member.handle !== 'missing.invalid'),
      ) ?? []

  const openChatControl = useCallback(() => {
    newChatControl.open()
  }, [newChatControl])
  const wrappedOpenChatControl = requireEmailVerification(openChatControl, {
    instructions: [
      <Trans key="new-chat">
        Before you can message another user, you must first verify your email.
      </Trans>,
    ],
  })

  return (
    <Layout.Header.Outer>
      {gtMobile ? (
        <>
          <Layout.Header.Content align="left">
            <Layout.Header.TitleText>
              <Trans>Chats</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>

          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <InboxRequests
              count={inboxAllConvos.length}
              more={hasMoreRequests}
              variant="solid"
            />
            <Link
              to="/messages/settings"
              label={l`Chat settings`}
              size="small"
              color="secondary"
              shape="round"
              style={[a.justify_center]}>
              <ButtonIcon icon={SettingsIcon} />
            </Link>
            <Button
              label={l`New chat`}
              color="primary"
              size="small"
              shape="round"
              onPress={wrappedOpenChatControl}>
              <ButtonIcon icon={NewChatIcon} />
            </Button>
          </View>
        </>
      ) : (
        <>
          <Layout.Header.MenuButton />
          <Layout.Header.Content align="left">
            <Layout.Header.TitleText>
              <Trans>Chats</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <InboxRequests
            count={inboxAllConvos.length}
            more={hasMoreRequests}
            variant="ghost"
          />
          <Layout.Header.Slot>
            <Link
              to="/messages/settings"
              label={l`Chat settings`}
              size="small"
              variant="ghost"
              color="secondary"
              shape="round"
              style={[a.justify_center]}>
              <ButtonIcon icon={SettingsIcon} size="lg" />
            </Link>
          </Layout.Header.Slot>
        </>
      )}
    </Layout.Header.Outer>
  )
}
