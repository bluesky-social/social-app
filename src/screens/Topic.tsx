import {useCallback, useMemo, useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {HITSLOP_10} from '#/lib/constants'
import {useIncrementalList} from '#/lib/hooks/useIncrementalList'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {cleanError} from '#/lib/strings/errors'
import {enforceLen} from '#/lib/strings/helpers'
import {
  useFeedShowMoreBatchSize,
  useFeedShowMoreEnabled,
} from '#/state/preferences/feed-show-more'
import {
  searchPostSlicesFromData,
  useSearchPostsV2Query,
} from '#/state/queries/search-posts-v2'
import {useSession} from '#/state/session'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {Post} from '#/view/com/post/Post'
import {List} from '#/view/com/util/List'
import {atoms as a, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {ShowMoreButton} from '#/components/ShowMoreButton'
import {type app} from '#/lexicons'

const renderItem = ({
  item,
}: ListRenderItemInfo<app.bsky.feed.defs.PostView>) => {
  return <Post post={item} />
}

const keyExtractor = (item: app.bsky.feed.defs.PostView, index: number) => {
  return `${item.uri}-${index}`
}

export default function TopicScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'Topic'>) {
  const {topic} = route.params
  const {t: l} = useLingui()

  const headerTitle = useMemo(() => {
    return enforceLen(decodeURIComponent(topic), 24, true, 'middle')
  }, [topic])

  const onShare = useCallback(() => {
    const url = new URL('https://bsky.app')
    url.pathname = `/topic/${topic}`
    void shareUrl(url.toString())
  }, [topic])

  const [activeTab, setActiveTab] = useState(0)

  const onPageSelected = (index: number) => {
    setActiveTab(index)
  }

  const sections = useMemo(() => {
    return [
      {
        title: l`Top`,
        component: (
          <TopicScreenTab topic={topic} sort="top" active={activeTab === 0} />
        ),
      },
      {
        title: l`Latest`,
        component: (
          <TopicScreenTab
            topic={topic}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
    ]
  }, [l, topic, activeTab])

  return (
    <Layout.Screen>
      <Pager
        onPageSelected={onPageSelected}
        renderTabBar={props => (
          <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
            <Layout.Header.Outer noBottomBorder>
              <Layout.Header.BackButton />
              <Layout.Header.Content>
                <Layout.Header.TitleText>{headerTitle}</Layout.Header.TitleText>
              </Layout.Header.Content>
              <Layout.Header.Slot>
                <Button
                  label={l`Share`}
                  size="small"
                  variant="ghost"
                  color="primary"
                  shape="round"
                  onPress={onShare}
                  hitSlop={HITSLOP_10}
                  style={[{right: -3}]}>
                  <ButtonIcon icon={Share} size="md" />
                </Button>
              </Layout.Header.Slot>
            </Layout.Header.Outer>
            <TabBar items={sections.map(section => section.title)} {...props} />
          </Layout.Center>
        )}
        initialPage={0}>
        {sections.map((section, i) => (
          <View key={i}>{section.component}</View>
        ))}
      </Pager>
    </Layout.Screen>
  )
}

function TopicScreenTab({
  topic,
  sort,
  active,
}: {
  topic: string
  sort: 'top' | 'latest'
  active: boolean
}) {
  const {t: l} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [isPTR, setIsPTR] = useState(false)
  const trackPostView = usePostViewTracking('Topic')
  const {currentAccount} = useSession()
  const showMoreEnabled = useFeedShowMoreEnabled()
  const showMoreBatchSize = useFeedShowMoreBatchSize()

  const {
    data,
    isFetched,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSearchPostsV2Query({
    query: decodeURIComponent(topic),
    sort,
    enabled: active,
  })

  const posts = useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || []
  }, [data])
  const slices = searchPostSlicesFromData(data)
  const {
    visibleSlices,
    canShowMore,
    showMorePostCount,
    isLoadingMore,
    onPressShowMore,
    reset: resetIncrementalList,
  } = useIncrementalList({
    enabled: showMoreEnabled,
    active,
    batchSize: showMoreBatchSize,
    slices,
    slicesFromData: searchPostSlicesFromData,
    resetKey: JSON.stringify([currentAccount?.did, topic, sort]),
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  })
  const visiblePosts = showMoreEnabled
    ? visibleSlices.map(slice => slice.post)
    : posts

  const onRefresh = useCallback(async () => {
    setIsPTR(true)
    const result = await refetch()
    if (result.isSuccess) resetIncrementalList()
    setIsPTR(false)
  }, [refetch, resetIncrementalList])

  const onEndReached = useCallback(() => {
    if (showMoreEnabled) return
    if (isFetchingNextPage || !hasNextPage || error) return
    void fetchNextPage()
  }, [showMoreEnabled, isFetchingNextPage, hasNextPage, error, fetchNextPage])

  return (
    <>
      {posts.length < 1 ? (
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
          isError={isError}
          onRetry={refetch}
          emptyType="results"
          emptyMessage={l`We couldn't find any results for that topic.`}
        />
      ) : (
        <List
          data={visiblePosts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTR}
          onRefresh={() => void onRefresh()}
          onEndReached={showMoreEnabled ? undefined : onEndReached}
          onEndReachedThreshold={4}
          onItemSeen={trackPostView}
          desktopFixedHeight
          ListFooterComponent={
            showMoreEnabled && canShowMore ? (
              <ShowMoreButton
                loading={isLoadingMore}
                onPress={() => void onPressShowMore()}
                postCount={showMorePostCount}
              />
            ) : (
              <ListFooter
                isFetchingNextPage={isFetchingNextPage}
                error={cleanError(error)}
                onRetry={fetchNextPage}
              />
            )
          }
          initialNumToRender={initialNumToRender}
          windowSize={11}
        />
      )}
    </>
  )
}
