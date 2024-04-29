import React, {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {MessagesTabNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {List} from '#/view/com/util/List'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
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
  const {getAgent} = useAgent()

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
        <NewChat onNewChat={onNewChat} />
      </>
    )
  }

  return (
    <View style={a.flex_1}>
      <ViewHeader
        title={_(msg`Messages`)}
        showOnDesktop
        renderButton={renderButton}
        showBorder
        canGoBack={false}
      />
      <NewChat onNewChat={onNewChat} />
      <List
        data={conversations}
        renderItem={({item}) => {
          let lastMessage = _(msg`No messages yet`)
          if (TempDmChatDefs.isMessageView(item.lastMessage)) {
            lastMessage = item.lastMessage.text
          }

          const otherUser = item.members.find(
            member => member.did !== getAgent().session?.did,
          )

          if (!otherUser) {
            return null
          }

          return (
            <Link
              to={`/messages/${item.id}`}
              style={[a.flex_1, a.pl_md, a.py_sm, a.gap_md, a.pr_2xl]}>
              <PreviewableUserAvatar profile={otherUser} size={42} />
              <View style={[a.flex_1]}>
                <Text numberOfLines={1} style={a.leading_snug}>
                  <Text
                    style={[t.atoms.text, item.unreadCount > 0 && a.font_bold]}>
                    {otherUser.displayName || otherUser.handle}
                  </Text>{' '}
                  <Text style={t.atoms.text_contrast_medium}>
                    @{otherUser.handle}
                  </Text>
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    a.text_sm,
                    item.unread ? a.font_bold : t.atoms.text_contrast_medium,
                  ]}>
                  {lastMessage}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View
                  style={[
                    a.flex_0,
                    a.ml_2xl,
                    {backgroundColor: t.palette.primary_500},
                    a.rounded_full,
                    {height: 7, width: 7},
                  ]}
                />
              )}
            </Link>
          )
        }}
        keyExtractor={item => item.id}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
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
      />
    </View>
  )
}
