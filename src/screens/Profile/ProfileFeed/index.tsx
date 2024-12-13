import React, {useCallback, useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {useAnimatedRef} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused, useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'

import {usePalette} from '#/lib/hooks/usePalette'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {ComposeIcon2} from '#/lib/icons'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {NavigationProp} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {s} from '#/lib/styles'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {FeedSourceFeedInfo, useFeedSourceInfoQuery} from '#/state/queries/feed'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {
  usePreferencesQuery,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {EmptyState} from '#/view/com/util/EmptyState'
import {FAB} from '#/view/com/util/fab/FAB'
import {Button} from '#/view/com/util/forms/Button'
import {ListRef} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {LoadingScreen} from '#/view/com/util/LoadingScreen'
import {Text} from '#/view/com/util/text/Text'
import {ProfileFeedHeader} from '#/screens/Profile/components/ProfileFeedHeader'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFeed'>
export function ProfileFeedScreen(props: Props) {
  const {rkey, name: handleOrDid} = props.route.params

  const pal = usePalette('default')
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const uri = useMemo(
    () => makeRecordUri(handleOrDid, 'app.bsky.feed.generator', rkey),
    [rkey, handleOrDid],
  )
  const {error, data: resolvedUri} = useResolveUriQuery(uri)

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  if (error) {
    return (
      <Layout.Screen testID="profileFeedScreenError">
        <Layout.Content>
          <View style={[pal.view, pal.border, styles.notFoundContainer]}>
            <Text type="title-lg" style={[pal.text, s.mb10]}>
              <Trans>Could not load feed</Trans>
            </Text>
            <Text type="md" style={[pal.text, s.mb20]}>
              {error.toString()}
            </Text>

            <View style={{flexDirection: 'row'}}>
              <Button
                type="default"
                accessibilityLabel={_(msg`Go back`)}
                accessibilityHint={_(msg`Returns to previous page`)}
                onPress={onPressBack}
                style={{flexShrink: 1}}>
                <Text type="button" style={pal.text}>
                  <Trans>Go Back</Trans>
                </Text>
              </Button>
            </View>
          </View>
        </Layout.Content>
      </Layout.Screen>
    )
  }

  return resolvedUri ? (
    <Layout.Screen noInsetTop>
      <ProfileFeedScreenIntermediate feedUri={resolvedUri.uri} />
    </Layout.Screen>
  ) : (
    <Layout.Screen>
      <LoadingScreen />
    </Layout.Screen>
  )
}

function ProfileFeedScreenIntermediate({feedUri}: {feedUri: string}) {
  const {data: preferences} = usePreferencesQuery()
  const {data: info} = useFeedSourceInfoQuery({uri: feedUri})

  if (!preferences || !info) {
    return <LoadingScreen />
  }

  return (
    <ProfileFeedScreenInner
      preferences={preferences}
      feedInfo={info as FeedSourceFeedInfo}
    />
  )
}

export function ProfileFeedScreenInner({
  feedInfo,
}: {
  preferences: UsePreferencesQueryResponse
  feedInfo: FeedSourceFeedInfo
}) {
  const {_} = useLingui()
  const {hasSession} = useSession()
  const {openComposer} = useComposerControls()
  const isScreenFocused = useIsFocused()

  useSetTitle(feedInfo?.displayName)

  const feed = `feedgen|${feedInfo.uri}` as FeedDescriptor

  const [hasNew, setHasNew] = React.useState(false)
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const queryClient = useQueryClient()
  const feedFeedback = useFeedFeedback(feed, hasSession)
  const scrollElRef = useAnimatedRef() as ListRef

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: 0, // -headerHeight,
    })
    truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
    setHasNew(false)
  }, [scrollElRef, queryClient, feed, setHasNew])

  React.useEffect(() => {
    if (!isScreenFocused) {
      return
    }
    return listenSoftReset(onScrollToTop)
  }, [onScrollToTop, isScreenFocused])

  const renderPostsEmpty = useCallback(() => {
    return <EmptyState icon="hashtag" message={_(msg`This feed is empty.`)} />
  }, [_])

  return (
    <>
      <ProfileFeedHeader info={feedInfo} />

      <FeedFeedbackProvider value={feedFeedback}>
        <PostFeed
          feed={feed}
          pollInterval={60e3}
          disablePoll={hasNew}
          onHasNew={setHasNew}
          scrollElRef={scrollElRef}
          onScrolledDownChange={setIsScrolledDown}
          renderEmptyState={renderPostsEmpty}
        />
      </FeedFeedbackProvider>

      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onScrollToTop}
          label={_(msg`Load new posts`)}
          showIndicator={hasNew}
        />
      )}

      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={() => openComposer({})}
          icon={
            <ComposeIcon2
              strokeWidth={1.5}
              size={29}
              style={{color: 'white'}}
            />
          }
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 50,
    marginLeft: 6,
  },
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
  aboutSectionContainer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    gap: 12,
  },
})
