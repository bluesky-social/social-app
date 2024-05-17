import React, {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {MessagesTabNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useListConvos} from '#/state/queries/messages/list-converations'
import {List} from '#/view/com/util/List'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {DialogControlProps, useDialogControl} from '#/components/Dialog'
import {NewChat} from '#/components/dms/NewChat'
import {useRefreshOnFocus} from '#/components/hooks/useRefreshOnFocus'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider} from '#/components/icons/SettingsSlider'
import {Link} from '#/components/Link'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'
import {ClipClopGate} from '../gate'
import {ChatListItem} from './ChatListItem'

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
  React.useEffect(() => {
    if (pushToConversation) {
      navigation.navigate('MessagesConversation', {
        conversation: pushToConversation,
      })
      navigation.setParams({pushToConversation: undefined})
    }
  }, [navigation, pushToConversation])

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
  } = useListConvos({refetchInterval: 15_000})

  useRefreshOnFocus(refetch)

  const isError = !!error

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

  const gate = useGate()
  if (!gate('dms')) return <ClipClopGate />

  if (conversations.length < 1) {
    return (
      <View style={a.flex_1}>
        {gtMobile ? (
          <CenteredView sideBorders>
            <DesktopHeader
              newChatControl={newChatControl}
              onNavigateToSettings={onNavigateToSettings}
            />
          </CenteredView>
        ) : (
          <ViewHeader
            title={_(msg`Messages`)}
            renderButton={renderButton}
            showBorder
            canGoBack={false}
          />
        )}
        {!isError && <NewChat onNewChat={onNewChat} control={newChatControl} />}
        <ListMaybePlaceholder
          isLoading={isLoading}
          isError={isError}
          emptyType="results"
          emptyTitle={_(msg`No chats yet`)}
          emptyMessage={_(
            msg`You have no chats yet. Start a conversation with someone!`,
          )}
          errorMessage={cleanError(error)}
          onRetry={isError ? refetch : undefined}
          hideBackButton
        />
      </View>
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
        a.py_md,
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
