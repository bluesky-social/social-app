import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useInfiniteQuery} from '@tanstack/react-query'

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
import {ClipClopGate} from '../gate'

type Props = NativeStackScreenProps<MessagesTabNavigatorParams, 'MessagesList'>
export function MessagesListScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()

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
  } = usePlaceholderConversations()

  const isError = !!error

  const conversations = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flat()
    }
    return []
  }, [data])

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh conversations', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more conversations', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const gate = useGate()
  if (!gate('dms')) return <ClipClopGate />

  if (conversations.length < 1) {
    return (
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
    )
  }

  return (
    <View>
      <ViewHeader
        title={_(msg`Messages`)}
        showOnDesktop
        renderButton={renderButton}
        showBorder
        canGoBack={false}
      />
      <List
        data={conversations}
        renderItem={({item}) => {
          return (
            <Link
              to={`/messages/${item.profile.handle}`}
              style={[a.flex_1, a.pl_md, a.py_sm, a.gap_md, a.pr_2xl]}>
              <PreviewableUserAvatar profile={item.profile} size={44} />
              <View style={[a.flex_1]}>
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    a.gap_lg,
                    a.flex_1,
                  ]}>
                  <Text numberOfLines={1}>
                    <Text style={item.unread && a.font_bold}>
                      {item.profile.displayName || item.profile.handle}
                    </Text>{' '}
                    <Text style={t.atoms.text_contrast_medium}>
                      @{item.profile.handle}
                    </Text>
                  </Text>
                  {item.unread && (
                    <View
                      style={[
                        a.ml_2xl,
                        {backgroundColor: t.palette.primary_500},
                        a.rounded_full,
                        {height: 7, width: 7},
                      ]}
                    />
                  )}
                </View>
                <Text
                  numberOfLines={2}
                  style={[
                    a.text_sm,
                    item.unread ? a.font_bold : t.atoms.text_contrast_medium,
                  ]}>
                  {item.lastMessage}
                </Text>
              </View>
            </Link>
          )
        }}
        keyExtractor={item => item.profile.did}
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

function usePlaceholderConversations() {
  const {getAgent} = useAgent()

  return useInfiniteQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const people = await getAgent().getProfiles({actors: PLACEHOLDER_PEOPLE})
      return people.data.profiles.map(profile => ({
        profile,
        unread: Math.random() > 0.5,
        lastMessage: getRandomPost(),
      }))
    },
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
  })
}

const PLACEHOLDER_PEOPLE = [
  'pfrazee.com',
  'haileyok.com',
  'danabra.mov',
  'esb.lol',
  'samuel.bsky.team',
]

function getRandomPost() {
  const num = Math.floor(Math.random() * 10)
  switch (num) {
    case 0:
      return 'hello'
    case 1:
      return 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
    case 2:
      return 'banger post'
    case 3:
      return 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
    case 4:
      return 'lol look at this bug'
    case 5:
      return 'wow'
    case 6:
      return "that's pretty cool, wow!"
    case 7:
      return 'I think this is a bug'
    case 8:
      return 'Hello World!'
    case 9:
      return 'DMs when???'
    default:
      return 'this is unlikely'
  }
}
