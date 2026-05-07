import React from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {HITSLOP_10} from '#/lib/constants'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {cleanError} from '#/lib/strings/errors'
import {enforceLen} from '#/lib/strings/helpers'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useAgent} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {Post} from '#/view/com/post/Post'
import {List} from '#/view/com/util/List'
import {atoms as a, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'

const TOPICS_API = 'https://api.blacksky.community'
const PAGE_SIZE = 25

const renderItem = ({item}: ListRenderItemInfo<AppBskyFeedDefs.PostView>) => {
  return <Post post={item} />
}

const keyExtractor = (item: AppBskyFeedDefs.PostView, index: number) => {
  return `${item.uri}-${index}`
}

export default function TopicScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'Topic'>) {
  const {topic: topicParam} = route.params
  const {_} = useLingui()

  const isTopicId = /^\d+$/.test(topicParam)

  const [topicName, setTopicName] = React.useState(
    isTopicId ? '' : decodeURIComponent(topicParam),
  )

  const headerTitle = React.useMemo(() => {
    return topicName ? enforceLen(topicName, 30, true, 'middle') : _(msg`Topic`)
  }, [topicName, _])

  const onShare = React.useCallback(() => {
    const url = new URL('https://blacksky.community')
    url.pathname = `/topic/${topicParam}`
    shareUrl(url.toString())
  }, [topicParam])

  const setMinimalShellMode = useSetMinimalShellMode()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  if (isTopicId) {
    return (
      <Layout.Screen>
        <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
          <Layout.Header.Outer>
            <Layout.Header.BackButton />
            <Layout.Header.Content>
              <Layout.Header.TitleText>{headerTitle}</Layout.Header.TitleText>
            </Layout.Header.Content>
            <Layout.Header.Slot>
              <Button
                label={_(msg`Share`)}
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
        </Layout.Center>
        <CuratedTopicFeed topicId={topicParam} onTopicName={setTopicName} />
      </Layout.Screen>
    )
  }

  // Legacy: search-based topic view (non-numeric topic param)
  return (
    <LegacyTopicScreen
      topicParam={topicParam}
      headerTitle={headerTitle}
      onShare={onShare}
    />
  )
}

function CuratedTopicFeed({
  topicId,
  onTopicName,
}: {
  topicId: string
  onTopicName: (name: string) => void
}) {
  const {_} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [isPTR, setIsPTR] = React.useState(false)
  const trackPostView = usePostViewTracking('Topic')
  const agent = useAgent()

  const {
    data,
    isLoading,
    isFetched,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['topic-feed', topicId],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({pageParam}) => {
      const params = new URLSearchParams({topicId, limit: String(PAGE_SIZE)})
      if (pageParam) params.set('cursor', pageParam)

      const res = await fetch(
        `${TOPICS_API}/xrpc/app.bsky.unspecced.getTopicFeed?${params}`,
      )
      if (!res.ok) throw new Error(`getTopicFeed failed: ${res.status}`)
      const json = (await res.json()) as {
        posts: string[]
        topic: {name: string}
        cursor: string | null
      }

      if (json.topic?.name) {
        onTopicName(json.topic.name)
      }

      if (!json.posts?.length) {
        return {posts: [] as AppBskyFeedDefs.PostView[], cursor: null}
      }

      // Hydrate post URIs through the appview (max 25 per call)
      const hydrated = await agent.getPosts({uris: json.posts.slice(0, 25)})
      return {
        posts: hydrated.data.posts,
        cursor: json.cursor,
      }
    },
    getNextPageParam: lastPage => lastPage?.cursor ?? undefined,
  })

  const posts = React.useMemo(() => {
    return data?.pages.flatMap(page => page.posts) ?? []
  }, [data])

  const onRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [refetch])

  const onEndReached = React.useCallback(() => {
    if (isFetchingNextPage || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  return (
    <>
      {posts.length < 1 ? (
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
          isError={isError}
          onRetry={refetch}
          emptyType="results"
          emptyMessage={_(msg`We couldn't find any results for that topic.`)}
        />
      ) : (
        <List
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTR}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={4}
          onItemSeen={trackPostView}
          // @ts-ignore web only -prf
          desktopFixedHeight
          ListFooterComponent={
            <ListFooter
              isFetchingNextPage={isFetchingNextPage}
              error={cleanError(error)}
              onRetry={fetchNextPage}
            />
          }
          initialNumToRender={initialNumToRender}
          windowSize={11}
        />
      )}
    </>
  )
}

export function* findAllPostsInTopicQueryData(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, undefined> {
  type PageData = {posts: AppBskyFeedDefs.PostView[]; cursor: string | null}
  const queryDatas = queryClient.getQueriesData<InfiniteData<PageData>>({
    queryKey: ['topic-feed'],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) continue
    for (const page of queryData.pages) {
      for (const post of page.posts) {
        if (post.uri === uri) {
          yield post
        }
      }
    }
  }
}

// Legacy search-based topic view for non-numeric topic params
function LegacyTopicScreen({
  topicParam,
  headerTitle,
  onShare,
}: {
  topicParam: string
  headerTitle: string
  onShare: () => void
}) {
  const {_} = useLingui()
  const [activeTab, setActiveTab] = React.useState(0)
  const setMinimalShellMode = useSetMinimalShellMode()

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setActiveTab(index)
    },
    [setMinimalShellMode],
  )

  const sections = React.useMemo(() => {
    return [
      {
        title: _(msg`Top`),
        component: (
          <TopicScreenTab
            topic={topicParam}
            sort="top"
            active={activeTab === 0}
          />
        ),
      },
      {
        title: _(msg`Latest`),
        component: (
          <TopicScreenTab
            topic={topicParam}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
    ]
  }, [_, topicParam, activeTab])

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
                  label={_(msg`Share`)}
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
  const {_} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [isPTR, setIsPTR] = React.useState(false)
  const trackPostView = usePostViewTracking('Topic')

  const {
    data,
    isFetched,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSearchPostsQuery({
    query: decodeURIComponent(topic),
    sort,
    enabled: active,
  })

  const posts = React.useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || []
  }, [data])

  const onRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [refetch])

  const onEndReached = React.useCallback(() => {
    if (isFetchingNextPage || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  return (
    <>
      {posts.length < 1 ? (
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
          isError={isError}
          onRetry={refetch}
          emptyType="results"
          emptyMessage={_(msg`We couldn't find any results for that topic.`)}
        />
      ) : (
        <List
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTR}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={4}
          onItemSeen={trackPostView}
          // @ts-ignore web only -prf
          desktopFixedHeight
          ListFooterComponent={
            <ListFooter
              isFetchingNextPage={isFetchingNextPage}
              error={cleanError(error)}
              onRetry={fetchNextPage}
            />
          }
          initialNumToRender={initialNumToRender}
          windowSize={11}
        />
      )}
    </>
  )
}
