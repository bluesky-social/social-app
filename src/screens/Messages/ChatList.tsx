import {useCallback, useEffect, useMemo, useState} from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useAppState} from '#/lib/hooks/useAppState'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {MessagesTabNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {MESSAGE_SCREEN_POLL_INTERVAL} from '#/state/messages/convo/const'
import {useMessagesEventBus} from '#/state/messages/events'
import {useListConvosQuery} from '#/state/queries/messages/list-converations'
import {List} from '#/view/com/util/List'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {DialogControlProps, useDialogControl} from '#/components/Dialog'
import {NewChat} from '#/components/dms/dialogs/NewChatDialog'
import {useRefreshOnFocus} from '#/components/hooks/useRefreshOnFocus'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Retry} from '#/components/icons/ArrowRotateCounterClockwise'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Message_Stroke2_Corner0_Rounded as Message} from '#/components/icons/Message'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider} from '#/components/icons/SettingsSlider'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {ChatListItem} from './components/ChatListItem'

type Props = NativeStackScreenProps<MessagesTabNavigatorParams, 'Messages'>

function renderItem({item}: {item: ChatBskyConvoDefs.ConvoView}) {
  return <ChatListItem convo={item} />
}

function keyExtractor(item: ChatBskyConvoDefs.ConvoView) {
  return item.id
}

export function MessagesScreen({navigation, route}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const newChatControl = useDialogControl()
  const {gtMobile} = useBreakpoints()
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

  const renderButton = useCallback(() => {
    return (
      <Link
        to="/messages/settings"
        label={_(msg`Chat settings`)}
        size="small"
        variant="ghost"
        color="secondary"
        shape="square"
        style={[a.justify_center]}>
        <SettingsSlider size="md" style={[t.atoms.text_contrast_medium]} />
      </Link>
    )
  }, [_, t])

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
  } = useListConvosQuery()

  useRefreshOnFocus(refetch)

  const conversations = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.convos)
    }
    return []
  }, [data])

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

  const onNewChat = useCallback(
    (conversation: string) =>
      navigation.navigate('MessagesConversation', {conversation}),
    [navigation],
  )

  const onNavigateToSettings = useCallback(() => {
    navigation.navigate('MessagesSettings')
  }, [navigation])

  if (conversations.length < 1) {
    return (
      <Layout.Screen>
        <CenteredView sideBorders={gtMobile} style={[a.h_full_vh]}>
          {gtMobile ? (
            <DesktopHeader
              newChatControl={newChatControl}
              onNavigateToSettings={onNavigateToSettings}
            />
          ) : (
            <ViewHeader
              title={_(msg`Messages`)}
              renderButton={renderButton}
              showBorder
              canGoBack={false}
            />
          )}

          {isLoading ? (
            <View style={[a.align_center, a.pt_3xl, web({paddingTop: '10vh'})]}>
              <Loader size="xl" />
            </View>
          ) : (
            <>
              {isError ? (
                <>
                  <View style={[a.pt_3xl, a.align_center]}>
                    <CircleInfo
                      width={48}
                      fill={t.atoms.border_contrast_low.borderColor}
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
                      {cleanError(error)}
                    </Text>

                    <Button
                      label={_(msg`Reload conversations`)}
                      size="large"
                      color="secondary"
                      variant="solid"
                      onPress={() => refetch()}>
                      <ButtonText>Retry</ButtonText>
                      <ButtonIcon icon={Retry} position="right" />
                    </Button>
                  </View>
                </>
              ) : (
                <>
                  <View style={[a.pt_3xl, a.align_center]}>
                    <Message width={48} fill={t.palette.primary_500} />
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
        </CenteredView>

        {!isLoading && !isError && (
          <NewChat onNewChat={onNewChat} control={newChatControl} />
        )}
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen testID="messagesScreen">
      {!gtMobile && (
        <ViewHeader
          title={_(msg`Messages`)}
          renderButton={renderButton}
          showBorder
          canGoBack={false}
        />
      )}
      <NewChat onNewChat={onNewChat} control={newChatControl} />
      <List
        data={conversations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        ListHeaderComponent={
          <DesktopHeader
            newChatControl={newChatControl}
            onNavigateToSettings={onNavigateToSettings}
          />
        }
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={fetchNextPage}
            style={{borderColor: 'transparent'}}
            hasNextPage={hasNextPage}
            showEndMessage={true}
            endMessageText={_(msg`No more conversations to show`)}
          />
        }
        onEndReachedThreshold={isNative ? 1.5 : 0}
        initialNumToRender={initialNumToRender}
        windowSize={11}
        // @ts-ignore our .web version only -sfn
        desktopFixedHeight
      />
    </Layout.Screen>
  )
}

function DesktopHeader({
  newChatControl,
  onNavigateToSettings,
}: {
  newChatControl: DialogControlProps
  onNavigateToSettings: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile, gtTablet} = useBreakpoints()

  if (!gtMobile) {
    return null
  }

  return (
    <View
      style={[
        t.atoms.bg,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_lg,
        a.px_lg,
        a.pr_md,
        a.py_sm,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <Text style={[a.text_2xl, a.font_bold]}>
        <Trans>Messages</Trans>
      </Text>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <Button
          label={_(msg`Message settings`)}
          color="secondary"
          size="small"
          variant="ghost"
          shape="square"
          onPress={onNavigateToSettings}>
          <SettingsSlider size="md" style={[t.atoms.text_contrast_medium]} />
        </Button>
        {gtTablet && (
          <Button
            label={_(msg`New chat`)}
            color="primary"
            size="small"
            variant="solid"
            onPress={newChatControl.open}>
            <ButtonIcon icon={Plus} position="left" />
            <ButtonText>
              <Trans>New chat</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </View>
  )
}
