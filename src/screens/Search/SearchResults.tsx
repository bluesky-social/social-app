import {memo, useCallback, useMemo, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {type AppBskyActorDefs, type AppBskyFeedDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {urls} from '#/lib/constants'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {cleanError} from '#/lib/strings/errors'
import {augmentSearchQuery} from '#/lib/strings/helpers'
import {useActorSearch} from '#/state/queries/actor-search'
import {usePopularFeedsSearch} from '#/state/queries/feed'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {Post} from '#/view/com/post/Post'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme, web} from '#/alf'
import * as FeedCard from '#/components/FeedCard'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {SearchError} from '#/components/SearchError'
import {Text} from '#/components/Typography'
import {type Metrics, useAnalytics} from '#/analytics'

let SearchResults = ({
  query,
  queryWithParams,
  activeTab,
  onPageSelected,
  headerHeight,
  initialPage = 0,
}: {
  query: string
  queryWithParams: string
  activeTab: number
  onPageSelected: (page: number) => void
  headerHeight: number
  initialPage?: number
}): React.ReactNode => {
  const {t: l} = useLingui()

  const sections = useMemo(() => {
    if (!queryWithParams) return []
    const noParams = queryWithParams === query
    return [
      {
        title: l`Top`,
        component: (
          <SearchScreenPostResults
            query={queryWithParams}
            sort="top"
            active={activeTab === 0}
          />
        ),
      },
      {
        title: l`Latest`,
        component: (
          <SearchScreenPostResults
            query={queryWithParams}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
      noParams && {
        title: l`People`,
        component: (
          <SearchScreenUserResults query={query} active={activeTab === 2} />
        ),
      },
      noParams && {
        title: l`Feeds`,
        component: (
          <SearchScreenFeedsResults query={query} active={activeTab === 3} />
        ),
      },
    ].filter(Boolean) as {
      title: string
      component: React.ReactNode
    }[]
  }, [l, query, queryWithParams, activeTab])

  return (
    <Pager
      onPageSelected={onPageSelected}
      renderTabBar={props => (
        <Layout.Center style={[a.z_10, web([a.sticky, {top: headerHeight}])]}>
          <TabBar items={sections.map(section => section.title)} {...props} />
        </Layout.Center>
      )}
      initialPage={initialPage}>
      {sections.map((section, i) => (
        <View key={i}>{section.component}</View>
      ))}
    </Pager>
  )
}
SearchResults = memo(SearchResults)
export {SearchResults}

function Loader() {
  return (
    <Layout.Content>
      <View style={[a.py_xl]}>
        <ActivityIndicator />
      </View>
    </Layout.Content>
  )
}

function EmptyState({
  messageText,
  error,
  children,
}: {
  messageText: React.ReactNode
  error?: string
  children?: React.ReactNode
}) {
  const t = useTheme()

  return (
    <Layout.Content>
      <View style={[a.p_xl]}>
        <View style={[t.atoms.bg_contrast_25, a.rounded_sm, a.p_lg]}>
          <Text style={[a.text_md]}>{messageText}</Text>

          {error && (
            <>
              <View
                style={[
                  {
                    marginVertical: 12,
                    height: 1,
                    width: '100%',
                    backgroundColor: t.atoms.text.color,
                    opacity: 0.2,
                  },
                ]}
              />

              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>Error: {error}</Trans>
              </Text>
            </>
          )}

          {children}
        </View>
      </View>
    </Layout.Content>
  )
}

function NoResultsText({
  query,
}: {
  sort?: 'top' | 'latest' | 'people' | 'feeds'
  query: string
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <>
      <Text style={[a.text_lg, t.atoms.text_contrast_high]}>
        <Trans>
          No results found for “
          <Text style={[a.text_lg, t.atoms.text, a.font_medium]}>{query}</Text>
          ”.
        </Trans>
      </Text>
      {'\n\n'}
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
        <Trans context="english-only-resource">
          Try a different search term, or{' '}
          <InlineLinkText
            label={l({
              message: 'read about how to use search filters',
              context: 'english-only-resource',
            })}
            to={urls.website.blog.searchTipsAndTricks}
            style={[a.text_md, a.leading_snug]}>
            read about how to use search filters.
          </InlineLinkText>
          .
        </Trans>
      </Text>
    </>
  )
}

type SearchResultSlice =
  | {
      type: 'post'
      key: string
      post: AppBskyFeedDefs.PostView
    }
  | {
      type: 'loadingMore'
      key: string
    }

let SearchScreenPostResults = ({
  query,
  sort,
  active,
}: {
  query: string
  sort?: 'top' | 'latest'
  active: boolean
}): React.ReactNode => {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const {currentAccount, hasSession} = useSession()
  const [isPTR, setIsPTR] = useState(false)
  const trackPostView = usePostViewTracking('SearchResults')

  const augmentedQuery = useMemo(() => {
    return augmentSearchQuery(query || '', {did: currentAccount?.did})
  }, [query, currentAccount])

  const {
    isFetched,
    data: results,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useSearchPostsQuery({query: augmentedQuery, sort, enabled: active})

  const t = useTheme()
  const onPullToRefresh = useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [setIsPTR, refetch])
  const onEndReached = useCallback(() => {
    if (isFetching || !hasNextPage || error) return
    void fetchNextPage()
  }, [isFetching, error, hasNextPage, fetchNextPage])

  const posts = useMemo(() => {
    return results?.pages.flatMap(page => page.posts) || []
  }, [results])
  const items = useMemo(() => {
    let temp: SearchResultSlice[] = []

    const seenUris = new Set()
    for (const post of posts) {
      if (seenUris.has(post.uri)) {
        continue
      }
      temp.push({
        type: 'post',
        key: post.uri,
        post,
      })
      seenUris.add(post.uri)
    }

    if (isFetchingNextPage) {
      temp.push({
        type: 'loadingMore',
        key: 'loadingMore',
      })
    }

    return temp
  }, [posts, isFetchingNextPage])

  const closeAllActiveElements = useCloseAllActiveElements()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  useFocusEffect(
    useCallback(() => {
      if (isFetched && sort) {
        ax.metric('search:results:loaded', {
          tab: sort,
          initialCount: items.length,
        })
      }
    }, [ax, isFetched, items, sort]),
  )

  const showSignIn = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }

  const showCreateAccount = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
  }

  if (!hasSession) {
    return (
      <SearchError title={l`Search is currently unavailable when logged out`}>
        <Text style={[a.text_md, a.text_center, a.leading_snug]}>
          <Trans>
            <InlineLinkText label={l`Sign in`} to="#" onPress={showSignIn}>
              Sign in
            </InlineLinkText>
            <Text style={t.atoms.text_contrast_medium}> or </Text>
            <InlineLinkText
              label={l`Create an account`}
              to={'#'}
              onPress={showCreateAccount}>
              create an account
            </InlineLinkText>
            <Text> </Text>
            <Text style={t.atoms.text_contrast_medium}>
              to search for news, sports, politics, and everything else
              happening on Bluesky.
            </Text>
          </Trans>
        </Text>
      </SearchError>
    )
  }

  return error ? (
    <EmptyState
      messageText={l`We’re sorry, but your search could not be completed. Please try again in a few minutes.`}
      error={cleanError(error)}
    />
  ) : (
    <>
      {isFetched ? (
        <>
          {posts.length ? (
            <List
              data={items}
              renderItem={({
                item,
                index,
              }: {
                item: SearchResultSlice
                index: number
              }) => {
                if (item.type === 'post') {
                  return (
                    <SearchPost from={sort} position={index} post={item.post} />
                  )
                } else {
                  return null
                }
              }}
              keyExtractor={(item: SearchResultSlice) => item.key}
              refreshing={isPTR}
              onRefresh={() => {
                void onPullToRefresh()
              }}
              onEndReached={onEndReached}
              onItemSeen={(item: SearchResultSlice) => {
                if (item.type === 'post') {
                  trackPostView(item.post)
                }
              }}
              desktopFixedHeight
              ListFooterComponent={
                <ListFooter
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage}
                />
              }
            />
          ) : (
            <EmptyState messageText={<NoResultsText query={query} />} />
          )}
        </>
      ) : (
        <Loader />
      )}
    </>
  )
}
SearchScreenPostResults = memo(SearchScreenPostResults)

function SearchPost({
  from,
  position,
  post,
}: {
  from: Metrics['search:result:press']['tab']
  position: Metrics['search:result:press']['position']
  post: AppBskyFeedDefs.PostView
}) {
  const ax = useAnalytics()

  const onBeforePress = useCallback(() => {
    ax.metric('search:result:press', {
      tab: from,
      resultType: 'post',
      position,
      uri: post.uri,
    })
  }, [ax, from, position, post])

  return <Post post={post} onBeforePress={onBeforePress} />
}

let SearchScreenUserResults = ({
  query,
  active,
}: {
  query: string
  active: boolean
}): React.ReactNode => {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const {hasSession} = useSession()
  const [isPTR, setIsPTR] = useState(false)

  const {
    isFetched,
    data: results,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useActorSearch({
    query,
    enabled: active,
  })

  const onPullToRefresh = useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [setIsPTR, refetch])
  const onEndReached = useCallback(() => {
    if (!hasSession) return
    if (isFetching || !hasNextPage || error) return
    void fetchNextPage()
  }, [isFetching, error, hasNextPage, fetchNextPage, hasSession])

  const profiles = useMemo(() => {
    return results?.pages.flatMap(page => page.actors) || []
  }, [results])

  useFocusEffect(
    useCallback(() => {
      if (isFetched) {
        ax.metric('search:results:loaded', {
          tab: 'people',
          initialCount: profiles.length,
        })
      }
    }, [ax, isFetched, profiles]),
  )

  if (error) {
    return (
      <EmptyState
        messageText={l`We’re sorry, but your search could not be completed. Please try again in a few minutes.`}
        error={error.toString()}
      />
    )
  }

  return isFetched && profiles ? (
    <>
      {profiles.length ? (
        <List
          data={profiles}
          renderItem={({
            item,
            index,
          }: {
            item: AppBskyActorDefs.ProfileView
            index: number
          }) => <SearchScreenProfileButton position={index} profile={item} />}
          keyExtractor={(item: AppBskyActorDefs.ProfileView) => item.did}
          refreshing={isPTR}
          onRefresh={() => {
            void onPullToRefresh()
          }}
          onEndReached={onEndReached}
          desktopFixedHeight
          ListFooterComponent={
            <ListFooter
              hasNextPage={hasNextPage && hasSession}
              isFetchingNextPage={isFetchingNextPage}
            />
          }
        />
      ) : (
        <EmptyState messageText={<NoResultsText query={query} />} />
      )}
    </>
  ) : (
    <Loader />
  )
}
SearchScreenUserResults = memo(SearchScreenUserResults)

function SearchScreenProfileButton({
  position,
  profile,
}: {
  position: number
  profile: AppBskyActorDefs.ProfileView
}) {
  const ax = useAnalytics()

  const handlePress = () => {
    ax.metric('search:result:press', {
      tab: 'people',
      resultType: 'profile',
      position,
      uri: `at://${profile.did}`,
    })
  }
  return <ProfileCardWithFollowBtn profile={profile} onPress={handlePress} />
}

let SearchScreenFeedsResults = ({
  query,
  active,
}: {
  query: string
  active: boolean
}): React.ReactNode => {
  const ax = useAnalytics()
  const t = useTheme()

  const {data: results, isFetched} = usePopularFeedsSearch({
    query,
    enabled: active,
  })

  useFocusEffect(
    useCallback(() => {
      if (isFetched) {
        ax.metric('search:results:loaded', {
          tab: 'feeds',
          initialCount: results?.length ?? 0,
        })
      }
    }, [ax, isFetched, results]),
  )

  return isFetched && results ? (
    <>
      {results.length ? (
        <List
          data={results}
          renderItem={({
            item,
            index,
          }: {
            item: AppBskyFeedDefs.GeneratorView
            index: number
          }) => (
            <View
              style={[
                a.border_t,
                t.atoms.border_contrast_low,
                a.px_lg,
                a.py_lg,
              ]}>
              <SearchFeedCard position={index} view={item} />
            </View>
          )}
          keyExtractor={(item: AppBskyFeedDefs.GeneratorView) => item.uri}
          desktopFixedHeight
          ListFooterComponent={<ListFooter />}
        />
      ) : (
        <EmptyState messageText={<NoResultsText query={query} />} />
      )}
    </>
  ) : (
    <Loader />
  )
}
SearchScreenFeedsResults = memo(SearchScreenFeedsResults)

function SearchFeedCard({
  position,
  view,
}: {
  position: number
  view: AppBskyFeedDefs.GeneratorView
}) {
  const ax = useAnalytics()

  const handleOnPress = () => {
    ax.metric('search:result:press', {
      tab: 'feeds',
      resultType: 'feed',
      position,
      uri: view.uri,
    })
  }

  return <FeedCard.Default view={view} onPress={handleOnPress} />
}
