/* eslint-disable react/prop-types */

import React, {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {MessagesTabNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {List} from '#/view/com/util/List'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {useBreakpoints, useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {DialogControlProps, useDialogControl} from '#/components/Dialog'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider} from '#/components/icons/SettingsSlider'
import {Link} from '#/components/Link'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'
import * as TempDmChatDefs from '#/temp/dm/defs'
import {NewChat} from '../../../components/dms/NewChat'
import {ClipClopGate} from '../gate'
import {useListChats} from '../Temp/query/query'

type Props = NativeStackScreenProps<MessagesTabNavigatorParams, 'MessagesList'>
export function MessagesListScreen({navigation}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const newChatControl = useDialogControl()
  const {gtMobile} = useBreakpoints()

  const renderButton = useCallback(() => {
    return (
      <Link
        to="/messages/settings"
        accessibilityLabel={_(msg`Message settings`)}
        accessibilityHint={_(msg`Opens the message settings page`)}>
        <SettingsSlider size="lg" style={t.atoms.text} />
      </Link>
    )
  }, [_, t.atoms.text])

  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useListChats()

  const isError = !!error

  const conversations = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.chats)
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

  const renderItem = useCallback(({item}: {item: TempDmChatDefs.ChatView}) => {
    return <ChatListItem key={item.id} chat={item} />
  }, [])

  const gate = useGate()
  if (!gate('dms')) return <ClipClopGate />

  if (conversations.length < 1) {
    return (
      <>
        <ListMaybePlaceholder
          isLoading={isLoading}
          isError={isError}
          emptyType="results"
          emptyMessage={_(
            msg`You have no messages yet. Start a conversation with someone!`,
          )}
          errorMessage={cleanError(error)}
          onRetry={isError ? refetch : undefined}
        />
        <NewChat onNewChat={onNewChat} control={newChatControl} />
      </>
    )
  }

  return (
    <View style={a.flex_1}>
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
        keyExtractor={item => item.id}
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
          />
        }
        onEndReachedThreshold={3}
        initialNumToRender={initialNumToRender}
        windowSize={11}
        // @ts-ignore our .web version only -sfn
        desktopFixedHeight
      />
    </View>
  )
}

function ChatListItem({chat}: {chat: TempDmChatDefs.ChatView}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()

  let lastMessage = _(msg`No messages yet`)
  let lastMessageSentAt: string | null = null
  if (TempDmChatDefs.isMessageView(chat.lastMessage)) {
    if (chat.lastMessage.sender?.did === currentAccount?.did) {
      lastMessage = _(msg`You: ${chat.lastMessage.text}`)
    } else {
      lastMessage = chat.lastMessage.text
    }
    lastMessageSentAt = chat.lastMessage.sentAt
  }
  if (TempDmChatDefs.isDeletedMessage(chat.lastMessage)) {
    lastMessage = _(msg`Message deleted`)
  }

  const otherUser = chat.members.find(
    member => member.did !== currentAccount?.did,
  )

  if (!otherUser) {
    return null
  }

  return (
    <Link to={`/messages/${chat.id}`} style={a.flex_1}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_row,
            a.flex_1,
            a.pl_md,
            a.py_sm,
            a.gap_md,
            a.pr_2xl,
            (hovered || pressed) && t.atoms.bg_contrast_25,
          ]}>
          <View pointerEvents="none">
            <PreviewableUserAvatar profile={otherUser} size={42} />
          </View>
          <View style={[a.flex_1]}>
            <Text numberOfLines={1} style={[a.text_md, a.leading_normal]}>
              <Text style={[t.atoms.text, chat.unreadCount > 0 && a.font_bold]}>
                {otherUser.displayName || otherUser.handle}
              </Text>{' '}
              {lastMessageSentAt ? (
                <TimeElapsed timestamp={lastMessageSentAt}>
                  {({timeElapsed}) => (
                    <Text style={t.atoms.text_contrast_medium}>
                      @{otherUser.handle} &middot; {timeElapsed}
                    </Text>
                  )}
                </TimeElapsed>
              ) : (
                <Text style={t.atoms.text_contrast_medium}>
                  @{otherUser.handle}
                </Text>
              )}
            </Text>
            <Text
              numberOfLines={2}
              style={[
                a.text_sm,
                a.leading_snug,
                chat.unreadCount > 0
                  ? a.font_bold
                  : t.atoms.text_contrast_medium,
              ]}>
              {lastMessage}
            </Text>
          </View>
          {chat.unreadCount > 0 && (
            <View
              style={[
                a.flex_0,
                a.ml_md,
                a.mt_sm,
                {backgroundColor: t.palette.primary_500},
                a.rounded_full,
                {height: 7, width: 7},
              ]}
            />
          )}
        </View>
      )}
    </Link>
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
        t.atoms.border_contrast_low,
        a.border_b,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_lg,
        a.px_lg,
        a.py_sm,
      ]}>
      <Text style={[a.text_2xl, a.font_bold]}>
        <Trans>Messages</Trans>
      </Text>
      <View style={[a.flex_row, a.align_center, a.gap_md]}>
        <Button
          label={_(msg`Message settings`)}
          color="secondary"
          size="large"
          variant="ghost"
          style={[{height: 'auto', width: 'auto'}, a.px_sm, a.py_sm]}
          onPress={onNavigateToSettings}>
          <ButtonIcon icon={SettingsSlider} />
        </Button>
        {gtTablet && (
          <Button
            label={_(msg`New chat`)}
            color="primary"
            size="large"
            variant="solid"
            style={[{height: 'auto', width: 'auto'}, a.px_md, a.py_sm]}
            onPress={newChatControl.open}>
            <ButtonIcon icon={Envelope} position="right" />
            <ButtonText>
              <Trans>New chat</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </View>
  )
}
