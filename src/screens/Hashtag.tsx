import {useCallback, useMemo, useState} from 'react'
import {type ListRenderItemInfo, ScrollView, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {HITSLOP_10} from '#/lib/constants'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {enforceLen} from '#/lib/strings/helpers'
import {useSearchPostsV2Query} from '#/state/queries/search-posts-v2'
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
import {LoggedOutSearchFooter} from '#/components/LoggedOutSearchFooter'
import {type app} from '#/lexicons'

const renderItem = ({
  item,
}: ListRenderItemInfo<app.bsky.feed.defs.PostView>) => {
  return <Post post={item} />
}

const keyExtractor = (item: app.bsky.feed.defs.PostView, index: number) => {
  return `${item.uri}-${index}`
}

export default function HashtagScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'Hashtag'>) {
  const {tag, author} = route.params
  const {t: l} = useLingui()

  const decodedTag = useMemo(() => {
    return decodeURIComponent(tag)
  }, [tag])

  const isCashtag = decodedTag.startsWith('$')

  const fullTag = useMemo(() => {
    // Cashtags already include the $ prefix, hashtags need # added
    return isCashtag ? decodedTag : `#${decodedTag}`
  }, [decodedTag, isCashtag])

  const headerTitle = useMemo(() => {
    // Keep cashtags uppercase, lowercase hashtags
    const displayTag = isCashtag ? fullTag.toUpperCase() : fullTag.toLowerCase()
    return enforceLen(displayTag, 24, true, 'middle')
  }, [fullTag, isCashtag])

  const sanitizedAuthor = useMemo(() => {
    if (!author) return ''
    return sanitizeHandle(author)
  }, [author])

  const onShare = useCallback(() => {
    const url = new URL('https://bsky.app')
    url.pathname = `/hashtag/${decodeURIComponent(tag)}`
    if (author) {
      url.searchParams.set('author', author)
    }
    void shareUrl(url.toString())
  }, [tag, author])

  const [activeTab, setActiveTab] = useState(0)

  const onPageSelected = (index: number) => {
    setActiveTab(index)
  }

  const sections = useMemo(() => {
    return [
      {
        title: l`Top`,
        component: (
          <HashtagScreenTab
            fullTag={fullTag}
            author={author}
            sort="top"
            active={activeTab === 0}
          />
        ),
      },
      {
        title: l`Latest`,
        component: (
          <HashtagScreenTab
            fullTag={fullTag}
            author={author}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
    ]
  }, [l, fullTag, author, activeTab])

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
                {author && (
                  <Layout.Header.SubtitleText>
                    {author.startsWith('did:')
                      ? l`From ${sanitizedAuthor}`
                      : l`From @${sanitizedAuthor}`}
                  </Layout.Header.SubtitleText>
                )}
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

function HashtagScreenTab({
  fullTag,
  author,
  sort,
  active,
}: {
  fullTag: string
  author: string | undefined
  sort: 'top' | 'latest'
  active: boolean
}) {
  const {t: l} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [isPTR, setIsPTR] = useState(false)
  const {hasSession} = useSession()
  const trackPostView = usePostViewTracking('Hashtag')

  const isCashtag = fullTag.startsWith('$')

  const queryParam = useMemo(() => {
    // Cashtags need # prefix for search: "#$BTC"
    return isCashtag ? `#${fullTag}` : fullTag
  }, [fullTag, isCashtag])

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
  } = useSearchPostsV2Query({
    query: queryParam,
    sort,
    enabled: active,
    filters: {
      author,
    },
  })

  const posts = useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || []
  }, [data])
  const showLoggedOutFooter = !hasSession && !!data?.pages[0]?.cursor

  const onRefresh = useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [refetch])

  const onEndReached = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage || error) return
    void fetchNextPage()
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  return (
    <>
      {posts.length < 1 ? (
        <ScrollView style={a.flex_1}>
          <ListMaybePlaceholder
            isLoading={isLoading || !isFetched}
            isError={isError}
            onRetry={refetch}
            emptyType="results"
            emptyMessage={l`We couldn't find any results for that tag.`}
          />
          {showLoggedOutFooter && <LoggedOutSearchFooter />}
        </ScrollView>
      ) : (
        <List
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTR}
          onRefresh={() => void onRefresh()}
          onEndReached={onEndReached}
          onEndReachedThreshold={4}
          onItemSeen={trackPostView}
          desktopFixedHeight
          ListFooterComponent={
            showLoggedOutFooter ? (
              <LoggedOutSearchFooter />
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
