import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  ChatBskyConvoDefs,
  type ChatBskyConvoListConvoRequests,
  ChatBskyGroupDefs,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'

import {useAppState} from '#/lib/appState'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {MESSAGE_SCREEN_POLL_INTERVAL} from '#/state/messages/convo/const'
import {useMessagesEventBus} from '#/state/messages/events'
import {useUnreadCountsQuery} from '#/state/queries/messages/get-unread-counts'
import {useListConvoRequests} from '#/state/queries/messages/list-conversation-requests'
import {useUpdateAllRead} from '#/state/queries/messages/update-all-read'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {ChatListLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useTheme, web} from '#/alf'
import {AgeRestrictedScreen} from '#/components/ageAssurance/AgeRestrictedScreen'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useRefreshOnFocus} from '#/components/hooks/useRefreshOnFocus'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotate'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Inbox_Stroke2_Corner2_Rounded_Large as InboxLargeIcon} from '#/components/icons/Inbox'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {IncomingRequestListItem} from './components/IncomingRequestListItem'
import {OutgoingRequestListItem} from './components/OutgoingRequestListItem'
import {useIsWithinSplitView} from './components/splitView/context'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesInbox'>

type RequestItem =
  | {type: 'incoming'; view: ChatBskyConvoDefs.ConvoView}
  | {type: 'outgoing'; view: ChatBskyGroupDefs.JoinRequestConvoView}

export function MessagesInboxScreen(props: Props) {
  const {t: l} = useLingui()
  const aaCopy = useAgeAssuranceCopy()
  return (
    <AgeRestrictedScreen
      screenTitle={l`Chat requests`}
      infoText={aaCopy.chatsInfoText}>
      <MessagesInboxScreenInner {...props} />
    </AgeRestrictedScreen>
  )
}

export function MessagesInboxScreenInner({}: Props) {
  const listConvosQuery = useListConvoRequests()
  const {data} = listConvosQuery

  const conversations = useMemo<RequestItem[]>(() => {
    if (!data?.pages) return []
    const items: RequestItem[] = []
    for (const page of data.pages) {
      for (const item of page.requests) {
        if (ChatBskyConvoDefs.isConvoView(item)) {
          items.push({type: 'incoming', view: item})
        } else if (ChatBskyGroupDefs.isJoinRequestConvoView(item)) {
          items.push({type: 'outgoing', view: item})
        }
      }
    }
    return items
  }, [data])

  const {data: unreadCounts} = useUnreadCountsQuery()
  const hasUnreadConvos = (unreadCounts?.unreadRequestConvos ?? 0) > 0

  return (
    <Layout.Screen testID="messagesInboxScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Chat requests</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        {hasUnreadConvos ? <MarkAsReadHeaderButton /> : <Layout.Header.Slot />}
      </Layout.Header.Outer>
      <RequestList
        listConvosQuery={listConvosQuery}
        conversations={conversations}
      />
    </Layout.Screen>
  )
}

function RequestList({
  listConvosQuery,
  conversations,
}: {
  listConvosQuery: UseInfiniteQueryResult<
    InfiniteData<ChatBskyConvoListConvoRequests.OutputSchema>,
    Error
  >
  conversations: RequestItem[]
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {isWithinSplitView} = useIsWithinSplitView()

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

  const initialNumToRender = useInitialNumToRender({minItemHeight: 130})
  const [isPTRing, setIsPTRing] = useState(false)

  const {
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = listConvosQuery

  useRefreshOnFocus(refetch)

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh conversations', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more conversations', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  if (conversations.length < 1) {
    return (
      <Layout.Center style={web([a.h_full])}>
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
            ) : (
              <EmptyState
                message={l({
                  message: `Inbox zero!`,
                  comment:
                    "Title message shown in chat requests inbox when it's empty",
                })}
                icon={InboxLargeIcon}
                iconSize="4xl"
                textStyle={t.atoms.text}
                iconColor={t.atoms.text.color}
                button={
                  isWithinSplitView
                    ? undefined
                    : {
                        label: l`Back to Chats`,
                        text: l`Back`,
                        onPress: () => {
                          if (navigation.canGoBack()) {
                            navigation.goBack()
                          } else {
                            navigation.navigate('Messages', {animation: 'pop'})
                          }
                        },
                        size: 'small',
                        color: 'secondary',
                        icon: ArrowLeftIcon,
                      }
                }
                style={web([a.h_full, a.justify_center, a.pb_5xl])}
              />
            )}
          </>
        )}
      </Layout.Center>
    )
  }

  return (
    <>
      <List
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
        contentContainerStyle={[web(a.py_sm)]}
      />
    </>
  )
}

function keyExtractor(item: RequestItem) {
  return item.type === 'incoming' ? item.view.id : item.view.convoId
}

function renderItem({item}: {item: RequestItem}) {
  if (item.type === 'incoming') {
    return <IncomingRequestListItem convo={item.view} />
  }
  return <OutgoingRequestListItem convo={item.view} />
}

function MarkAsReadHeaderButton() {
  const {t: l} = useLingui()
  const {mutate: markAllRead} = useUpdateAllRead('request', {
    onMutate: () => {
      Toast.show(l`Marked all as read`, {
        type: 'success',
      })
    },
    onError: () => {
      Toast.show(l`Failed to mark all requests as read`, {
        type: 'error',
      })
    },
  })

  return (
    <Button
      label={l`Mark all as read`}
      size="small"
      color="secondary"
      onPress={() => markAllRead()}>
      <ButtonIcon icon={CheckIcon} />
      <ButtonText>
        <Trans>Mark all as read</Trans>
      </ButtonText>
    </Button>
  )
}
