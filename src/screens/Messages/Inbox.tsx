import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {useAppState} from '#/lib/hooks/useAppState'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {
  CommonNavigatorParams,
  NativeStackScreenProps,
  NavigationProp,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {MESSAGE_SCREEN_POLL_INTERVAL} from '#/state/messages/convo/const'
import {useMessagesEventBus} from '#/state/messages/events'
import {useLeftConvos} from '#/state/queries/messages/leave-conversation'
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useRefreshOnFocus} from '#/components/hooks/useRefreshOnFocus'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotateCounterClockwise'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {RequestListItem} from './components/RequestListItem'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesInbox'>
export function MessagesInboxScreen({}: Props) {
  return (
    <Layout.Screen testID="messagesInboxScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Chat requests</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <RequestList />
    </Layout.Screen>
  )
}

function RequestList() {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

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
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useListConvosQuery({status: 'request'})

  useRefreshOnFocus(refetch)

  const leftConvos = useLeftConvos()

  const conversations = useMemo(() => {
    if (data?.pages) {
      const conversations = data.pages
        .flatMap(page => page.convos)
        // filter out convos that are actively being left
        .filter(convo => !leftConvos.includes(convo.id))

      return conversations
    }
    return []
  }, [data, leftConvos])

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
      <Layout.Center>
        {isLoading ? (
          <View style={[a.align_center, a.pt_3xl, web({paddingTop: '10vh'})]}>
            <Loader size="xl" />
          </View>
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
                    {cleanError(error) || _(msg`Failed to load conversations`)}
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
                    <Trans>Inbox zero!</Trans>
                  </Text>
                  <Text
                    style={[
                      a.text_md,
                      a.pb_xl,
                      a.text_center,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    <Trans>
                      You don't have any chat requests at the moment.
                    </Trans>
                  </Text>
                  <Button
                    variant="solid"
                    color="secondary"
                    size="small"
                    label={_(msg`Go back`)}
                    onPress={() => {
                      if (navigation.canGoBack()) {
                        navigation.goBack()
                      } else {
                        navigation.navigate('Messages', {animation: 'pop'})
                      }
                    }}>
                    <ButtonIcon icon={ArrowLeftIcon} />
                    <ButtonText>
                      <Trans>Back to Chats</Trans>
                    </ButtonText>
                  </Button>
                </View>
              </>
            )}
          </>
        )}
      </Layout.Center>
    )
  }

  return (
    <List
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
  )
}

function keyExtractor(item: ChatBskyConvoDefs.ConvoView) {
  return item.id
}

function renderItem({item}: {item: ChatBskyConvoDefs.ConvoView}) {
  return <RequestListItem convo={item} />
}
