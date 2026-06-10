import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {useAnimatedRef} from 'react-native-reanimated'
import {type ChatBskyActorGetStatus, ChatBskyConvoDefs} from '@atproto/api'
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
import {useChatActorStatusQuery} from '#/state/queries/messages/get-status'
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
import {ChatDisabled} from './components/ChatDisabled'
import {ChatListItem} from './components/ChatListItem'
import {InboxRequests} from './components/InboxRequests'
import {useIsWithinSplitView} from './components/splitView/context'
import {splitViewLeftScroll} from './components/splitView/leftColumnScroll'

type ChatStatus = ChatBskyActorGetStatus.OutputSchema

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
  const {data: chatStatus} = useChatActorStatusQuery()
  const pushToConversation = route.params?.pushToConversation
  const pushToNewGroupChat = route.params?.pushToNewGroupChat
  // Tracks whether the next new-chat dialog open should start directly on the
  // group-chat creation step. Set when deep-linked via `pushToNewGroupChat`,
  // and reset to `false` whenever the dialog is opened through the normal FAB/
  // button path so it never gets stuck in group mode.
  const [startNewChatInGroupChat, setStartNewChatInGroupChat] = useState(false)

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

  const openChatControl = useCallback(() => {
    setStartNewChatInGroupChat(false)
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

  // Deep link into the group-chat creation step of the new-chat dialog. Mirrors
  // the `pushToConversation` pattern: open the dialog (respecting the same
  // email-verification gating as the normal new-chat button) starting directly
  // in group mode, then clear the param so it can fire again later.
  const openGroupChatControl = useCallback(() => {
    setStartNewChatInGroupChat(true)
    newChatControl.open()
  }, [newChatControl])
  const wrappedOpenGroupChatControl = requireEmailVerification(
    openGroupChatControl,
    {
      instructions: [
        <Trans key="new-group-chat">
          Before you can message another user, you must first verify your email.
        </Trans>,
      ],
    },
  )
  useEffect(() => {
    if (pushToNewGroupChat) {
      // clear the param first so re-renders don't re-trigger the open, then
      // open the dialog (gated by email verification) in group mode
      navigation.setParams({pushToNewGroupChat: undefined})
      wrappedOpenGroupChatControl()
    }
  }, [navigation, pushToNewGroupChat, wrappedOpenGroupChatControl])

  if (isWithinSplitView) {
    return (
      <>
        <EmptyState
          message={l`Say hi to someone`}
          icon={BubbleSmileIcon}
          textStyle={t.atoms.text}
          iconColor={t.atoms.text.color}
          iconSize="4xl"
          button={
            chatStatus?.chatDisabled
              ? undefined
              : {
                  label: l`New chat`,
                  text: l`New chat`,
                  onPress: wrappedOpenChatControl,
                  size: 'small',
                  color: 'primary',
                  icon: MessagePlusIcon,
                }
          }
          style={[a.h_full, a.justify_center, a.pb_5xl]}
        />
        <NewChat
          onNewChat={onNewChat}
          control={newChatControl}
          startInGroupChat={startNewChatInGroupChat}
          onClose={() => setStartNewChatInGroupChat(false)}
        />
      </>
    )
  }

  return (
    <Layout.Screen testID="messagesScreen">
      <Header newChatControl={newChatControl} chatStatus={chatStatus} />
      <ChatList newChatControl={newChatControl} chatStatus={chatStatus} />
      <NewChat
        onNewChat={onNewChat}
        control={newChatControl}
        startInGroupChat={startNewChatInGroupChat}
        onClose={() => setStartNewChatInGroupChat(false)}
      />
    </Layout.Screen>
  )
}

export function ChatList({
  selectedChat,
  newChatControl,
  chatStatus,
}: {
  selectedChat?: string
  newChatControl: DialogControlProps
  chatStatus: ChatStatus | undefined
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const aa = useAgeAssurance()
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
    kind: aa.flags.groupChatDisabled ? 'direct' : 'all',
  })

  useRefreshOnFocus(refetch)
  useRefreshOnFocus(refetchInbox)

  const conversations = useMemo(() => {
    if (data?.pages) {
      const conversations = data.pages.flatMap(page => page.convos)

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
  }, [data, selectedChat])

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
    if (isWithinSplitView) {
      splitViewLeftScroll.current = 0
      restoredRef.current = true
    }
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh conversations', {message: err})
    }
  }, [scrollElRef, refetch, isWithinSplitView])

  // Restore the saved scroll offset once the list has rendered enough
  // content to honor it. Module-level ref survives ChatList re-mounts that
  // happen on in-splitview navigation (see leftColumnScroll.ts).
  const restoredRef = useRef(false)
  const onContentSizeChange = useCallback(
    (_w: number, h: number) => {
      if (!isWithinSplitView || restoredRef.current) return
      const offset = splitViewLeftScroll.current
      if (offset > 0 && h >= offset) {
        scrollElRef.current?.scrollToOffset({offset, animated: false})
        restoredRef.current = true
      }
    },
    [isWithinSplitView, scrollElRef],
  )

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
                message={l`Say hi to someone`}
                icon={BubbleSmileIcon}
                textStyle={t.atoms.text}
                iconColor={t.atoms.text.color}
                iconSize="4xl"
                button={
                  chatStatus?.chatDisabled
                    ? undefined
                    : {
                        label: l`New chat`,
                        text: l`New chat`,
                        onPress: wrappedOpenChatControl,
                        size: 'small',
                        color: 'primary',
                        icon: MessagePlusIcon,
                      }
                }
                style={[a.h_full, {paddingTop: '20%'}]}
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
      ListHeaderComponent={
        chatStatus?.chatDisabled ? (
          <ChatDisabled shape="banner" style={[isWithinSplitView && a.mb_sm]} />
        ) : undefined
      }
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
      onContentSizeChange={onContentSizeChange}
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
      contentContainerStyle={
        isWithinSplitView && !chatStatus?.chatDisabled && a.py_sm
      }
    />
  )
}

export function Header({
  newChatControl,
  chatStatus,
}: {
  newChatControl: DialogControlProps
  chatStatus: ChatStatus | undefined
}) {
  const {t: l} = useLingui()
  const {gtMobile} = useBreakpoints()
  const aa = useAgeAssurance()
  const requireEmailVerification = useRequireEmailVerification()
  const {isWithinSplitView} = useIsWithinSplitView()

  // In split view, the left column (and this header) stays mounted while the
  // right column shows the selected route. Pushing would stack duplicate routes
  // on repeated clicks, so navigate instead to dedupe by route + params.
  const action = isWithinSplitView ? 'navigate' : 'push'

  const {data: unreadInboxData, hasNextPage: hasMoreRequests} =
    useListConvosQuery({
      status: 'request',
      readState: 'unread',
      kind: aa.flags.groupChatDisabled ? 'direct' : 'all',
    })

  const inboxAllConvos =
    unreadInboxData?.pages
      .flatMap(page => page.convos)
      .filter(
        convo =>
          !convo.muted &&
          convo.members.every(member => member.handle !== 'missing.invalid') &&
          (ChatBskyConvoDefs.isGroupConvo(convo.kind)
            ? !aa.flags.groupChatDisabled
            : true),
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
              action={action}
            />
            <Link
              to="/messages/settings"
              action={action}
              label={l`Chat settings`}
              size="small"
              color="secondary"
              shape="round"
              style={[a.justify_center]}>
              <ButtonIcon icon={SettingsIcon} />
            </Link>
            {!chatStatus?.chatDisabled && (
              <Button
                label={l`New chat`}
                color="primary"
                size="small"
                shape="round"
                onPress={wrappedOpenChatControl}>
                <ButtonIcon icon={NewChatIcon} />
              </Button>
            )}
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
