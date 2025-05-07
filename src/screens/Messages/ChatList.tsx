import {useCallback, useEffect, useMemo, useState} from 'react'
import {View} from 'react-native'
import {useAnimatedRef} from 'react-native-reanimated'
import {type ChatBskyActorDefs, type ChatBskyConvoDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {useAppState} from '#/lib/hooks/useAppState'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {type MessagesTabNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {MESSAGE_SCREEN_POLL_INTERVAL} from '#/state/messages/convo/const'
import {useMessagesEventBus} from '#/state/messages/events'
import {useLeftConvos} from '#/state/queries/messages/leave-conversation'
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {useSession} from '#/state/session'
import {List, type ListRef} from '#/view/com/util/List'
import {ChatListLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {type DialogControlProps, useDialogControl} from '#/components/Dialog'
import {NewChat} from '#/components/dms/dialogs/NewChatDialog'
import {useRefreshOnFocus} from '#/components/hooks/useRefreshOnFocus'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotateCounterClockwise'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {Text} from '#/components/Typography'
import {ChatListItem} from './components/ChatListItem'
import {InboxPreview} from './components/InboxPreview'

type ListItem =
  | {
      type: 'INBOX'
      count: number
      profiles: ChatBskyActorDefs.ProfileViewBasic[]
    }
  | {
      type: 'CONVERSATION'
      conversation: ChatBskyConvoDefs.ConvoView
    }

function renderItem({item}: {item: ListItem}) {
  switch (item.type) {
    case 'INBOX':
      return <InboxPreview count={item.count} profiles={item.profiles} />
    case 'CONVERSATION':
      return <ChatListItem convo={item.conversation} />
  }
}

function keyExtractor(item: ListItem) {
  return item.type === 'INBOX' ? 'INBOX' : item.conversation.id
}

type Props = NativeStackScreenProps<MessagesTabNavigatorParams, 'Messages'>
export function MessagesScreen({navigation, route}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const newChatControl = useDialogControl()
  const scrollElRef: ListRef = useAnimatedRef()
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

  const {data: inboxData, refetch: refetchInbox} = useListConvosQuery({
    status: 'request',
  })

  useRefreshOnFocus(refetch)
  useRefreshOnFocus(refetchInbox)

  const leftConvos = useLeftConvos()

  const inboxPreviewConvos = useMemo(() => {
    const inbox =
      inboxData?.pages
        .flatMap(page => page.convos)
        .filter(
          convo =>
            !leftConvos.includes(convo.id) &&
            !convo.muted &&
            convo.unreadCount > 0 &&
            convo.members.every(member => member.handle !== 'missing.invalid'),
        ) ?? []

    return inbox
      .map(x => x.members.find(y => y.did !== currentAccount?.did))
      .filter(x => !!x)
  }, [inboxData, leftConvos, currentAccount?.did])

  const conversations = useMemo(() => {
    if (data?.pages) {
      const conversations = data.pages
        .flatMap(page => page.convos)
        // filter out convos that are actively being left
        .filter(convo => !leftConvos.includes(convo.id))

      return [
        {
          type: 'INBOX',
          count: inboxPreviewConvos.length,
          profiles: inboxPreviewConvos.slice(0, 3),
        },
        ...conversations.map(
          convo => ({type: 'CONVERSATION', conversation: convo} as const),
        ),
      ] satisfies ListItem[]
    }
    return []
  }, [data, leftConvos, inboxPreviewConvos])

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

  const onNewChat = useCallback(
    (conversation: string) =>
      navigation.navigate('MessagesConversation', {conversation}),
    [navigation],
  )

  const onSoftReset = useCallback(async () => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
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
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, isScreenFocused])

  // Will always have 1 item - the inbox button
  if (conversations.length < 2) {
    return (
      <Layout.Screen>
        <Header newChatControl={newChatControl} />
        <Layout.Center>
          <InboxPreview
            count={inboxPreviewConvos.length}
            profiles={inboxPreviewConvos}
          />
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
                    <Text style={[a.pt_md, a.pb_sm, a.text_2xl, a.font_bold]}>
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
                      {cleanError(error) ||
                        _(msg`Failed to load conversations`)}
                    </Text>

                    <Button
                      label={_(msg`Reload conversations`)}
                      size="small"
                      color="secondary_inverted"
                      variant="solid"
                      onPress={() => refetch()}>
                      <ButtonText>
                        <Trans>Retry</Trans>
                      </ButtonText>
                      <ButtonIcon icon={RetryIcon} position="right" />
                    </Button>
                  </View>
                </>
              ) : (
                <>
                  <View style={[a.pt_3xl, a.align_center]}>
                    <MessageIcon width={48} fill={t.palette.primary_500} />
                    <Text style={[a.pt_md, a.pb_sm, a.text_2xl, a.font_bold]}>
                      <Trans>Nothing here</Trans>
                    </Text>
                    <Text
                      style={[
                        a.text_md,
                        a.pb_xl,
                        a.text_center,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>You have no conversations yet. Start one!</Trans>
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </Layout.Center>

        {!isLoading && !isError && (
          <NewChat onNewChat={onNewChat} control={newChatControl} />
        )}
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen testID="messagesScreen">
      <Header newChatControl={newChatControl} />
      <NewChat onNewChat={onNewChat} control={newChatControl} />
      <List
        ref={scrollElRef}
        data={conversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={fetchNextPage}
            style={{borderColor: 'transparent'}}
            hasNextPage={hasNextPage}
          />
        }
        onEndReachedThreshold={isNative ? 1.5 : 0}
        initialNumToRender={initialNumToRender}
        windowSize={11}
        desktopFixedHeight
        sideBorders={false}
      />
    </Layout.Screen>
  )
}

function Header({newChatControl}: {newChatControl: DialogControlProps}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const requireEmailVerification = useRequireEmailVerification()

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

  const settingsLink = (
    <Link
      to="/messages/settings"
      label={_(msg`Chat settings`)}
      size="small"
      variant="ghost"
      color="secondary"
      shape="round"
      style={[a.justify_center]}>
      <ButtonIcon icon={SettingsIcon} size="lg" />
    </Link>
  )

  return (
    <Layout.Header.Outer>
      {gtMobile ? (
        <>
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Chats</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>

          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            {settingsLink}
            <Button
              label={_(msg`New chat`)}
              color="primary"
              size="small"
              variant="solid"
              onPress={wrappedOpenChatControl}>
              <ButtonIcon icon={PlusIcon} position="left" />
              <ButtonText>
                <Trans>New chat</Trans>
              </ButtonText>
            </Button>
          </View>
        </>
      ) : (
        <>
          <Layout.Header.MenuButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Chats</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot>{settingsLink}</Layout.Header.Slot>
        </>
      )}
    </Layout.Header.Outer>
  )
}
