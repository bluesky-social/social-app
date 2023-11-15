import React from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native'
import {AppBskyActorDefs, AppBskyFeedDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {logger} from '#/logger'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from 'lib/routes/types'
import {CenteredView} from 'view/com/util/Views'
import {Text} from '#/view/com/util/text/Text'
import {ProfileCardLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {Post} from '#/view/com/post/Post'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'

// import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {usePalette} from '#/lib/hooks/usePalette'
import {useSession} from '#/state/session'
import {useMyFollowsQuery} from '#/state/queries/my-follows'
import {useGetSuggestedFollowersByActor} from '#/state/queries/suggested-follows'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useActorSearch} from '#/state/queries/actor-autocomplete'

function Loader() {
  return (
    <View style={{padding: 18}}>
      <ActivityIndicator />
    </View>
  )
}

// TODO refactor how to translate?
function EmptyState({message, error}: {message: string; error?: string}) {
  const pal = usePalette('default')

  return (
    <View style={[pal.viewLight, {padding: 18, borderRadius: 8}]}>
      <Text style={[pal.text]}>
        <Trans>{message}</Trans>
      </Text>

      {error && (
        <>
          <View
            style={[
              {
                marginVertical: 12,
                height: 1,
                width: '100%',
                backgroundColor: pal.text.color,
                opacity: 0.2,
              },
            ]}
          />

          <Text style={[pal.textLight]}>
            <Trans>Error:</Trans> {error}
          </Text>
        </>
      )}
    </View>
  )
}

function SearchScreenSuggestedFollows() {
  const {currentAccount} = useSession()
  const [dataUpdatedAt, setDataUpdatedAt] = React.useState(0)
  const [suggestions, setSuggestions] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])
  const getSuggestedFollowsByActor = useGetSuggestedFollowersByActor()

  React.useEffect(() => {
    async function getSuggestions() {
      // TODO not quite right, doesn't fetch your follows
      const friends = await getSuggestedFollowsByActor(
        currentAccount!.did,
      ).then(friendsRes => friendsRes.suggestions)

      if (!friends) return // :(

      const friendsOfFriends = (
        await Promise.all(
          friends
            .slice(0, 4)
            .map(friend =>
              getSuggestedFollowsByActor(friend.did).then(
                foafsRes => foafsRes.suggestions,
              ),
            ),
        )
      ).flat()

      setSuggestions(
        // dedupe
        friendsOfFriends.filter(f => !friends.find(f2 => f.did === f2.did)),
      )
      setDataUpdatedAt(Date.now())
    }

    try {
      getSuggestions()
    } catch (e) {
      logger.error(`SearchScreenSuggestedFollows: failed to get suggestions`, {
        error: e,
      })
    }
  }, [
    currentAccount,
    setSuggestions,
    setDataUpdatedAt,
    getSuggestedFollowsByActor,
  ])

  return suggestions.length ? (
    <FlatList
      data={suggestions}
      renderItem={({item}) => (
        <ProfileCardWithFollowBtn
          profile={item}
          noBg
          dataUpdatedAt={dataUpdatedAt}
        />
      )}
      keyExtractor={item => item.did}
      style={{flex: 1}}
    />
  ) : (
    <>
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
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

function SearchScreenPostResults({query}: {query: string}) {
  const pal = usePalette('default')
  const [isPTR, setIsPTR] = React.useState(false)
  const {
    isFetched,
    data: results,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    dataUpdatedAt,
  } = useSearchPostsQuery({query})

  const onPullToRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [setIsPTR, refetch])
  const onEndReached = React.useCallback(() => {
    if (isFetching || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetching, error, hasNextPage, fetchNextPage])

  const posts = React.useMemo(() => {
    return results?.pages.flatMap(page => page.posts) || []
  }, [results])
  const items = React.useMemo(() => {
    let items: SearchResultSlice[] = []

    for (const post of posts) {
      items.push({
        type: 'post',
        key: post.uri,
        post,
      })
    }

    if (isFetchingNextPage) {
      items.push({
        type: 'loadingMore',
        key: 'loadingMore',
      })
    }

    return items
  }, [posts, isFetchingNextPage])

  return error ? (
    <View style={{paddingHorizontal: 18}}>
      <EmptyState
        message="We're sorry, but your search could not be completed. Please try again in a few minutes."
        error={error.toString()}
      />
    </View>
  ) : (
    <>
      {isFetched ? (
        <>
          {posts.length ? (
            <FlatList
              data={items}
              renderItem={({item}) => {
                if (item.type === 'post') {
                  return <Post post={item.post} dataUpdatedAt={dataUpdatedAt} />
                } else {
                  return <Loader />
                }
              }}
              keyExtractor={item => item.key}
              style={{flex: 1}}
              refreshControl={
                <RefreshControl
                  refreshing={isPTR}
                  onRefresh={onPullToRefresh}
                  tintColor={pal.colors.text}
                  titleColor={pal.colors.text}
                />
              }
              onEndReached={onEndReached}
            />
          ) : (
            <View style={{padding: 18}}>
              <EmptyState message={`No results found for ${query}`} />
            </View>
          )}
        </>
      ) : (
        <Loader />
      )}
    </>
  )
}

function SearchScreenUserResults({query}: {query: string}) {
  const [isFetched, setIsFetched] = React.useState(false)
  const [dataUpdatedAt, setDataUpdatedAt] = React.useState(0)
  const [results, setResults] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])
  const search = useActorSearch()
  // fuzzy search relies on followers
  const {isFetched: isFollowsFetched} = useMyFollowsQuery()

  React.useEffect(() => {
    async function getResults() {
      const results = await search({query, limit: 30})

      if (results) {
        setDataUpdatedAt(Date.now())
        setResults(results)
        setIsFetched(true)
      }
    }

    if (query && isFollowsFetched) {
      getResults()
    } else {
      setResults([])
      setIsFetched(false)
    }
  }, [query, isFollowsFetched, setDataUpdatedAt, search])

  return isFetched ? (
    <>
      {results.length ? (
        <FlatList
          data={results}
          renderItem={({item}) => (
            <ProfileCardWithFollowBtn
              profile={item}
              noBg
              dataUpdatedAt={dataUpdatedAt}
            />
          )}
          keyExtractor={item => item.did}
          style={{flex: 1}}
        />
      ) : (
        <View style={{padding: 18}}>
          <EmptyState message={`No results found for ${query}`} />
        </View>
      )}
    </>
  ) : (
    <Loader />
  )
}

export function SearchScreenInner({query}: {query?: string}) {
  const pal = usePalette('default')

  return query ? (
    <>
      <PagerWithHeader
        items={['Posts', 'Users']}
        isHeaderReady={true}
        // must be positive height?
        renderHeader={() => <View style={{height: 1}} />}>
        {({headerHeight}) => (
          // TODO how do I use this
          <View style={{paddingTop: headerHeight}}>
            <SearchScreenPostResults query={query} />
          </View>
        )}
        {({headerHeight}) => (
          <View style={{paddingTop: headerHeight}}>
            <SearchScreenUserResults query={query} />
          </View>
        )}
      </PagerWithHeader>
    </>
  ) : (
    <>
      <Text
        type="title"
        style={[
          styles.heading,
          pal.text,
          pal.border,
          {
            display: 'flex',
            paddingVertical: 12,
            paddingHorizontal: 18,
            fontWeight: 'bold',
          },
        ]}>
        <Trans>Suggested Follows</Trans>
      </Text>
      <SearchScreenSuggestedFollows />
    </>
  )
}

export function SearchScreen({
  route,
}: NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>) {
  const {q} = route.params || {}
  const pal = usePalette('default')

  return (
    <CenteredView
      style={[
        pal.border,
        styles.scrollContainer,
        {borderLeftWidth: 1, borderRightWidth: 1},
      ]}>
      <SearchScreenInner query={q} />
    </CenteredView>
  )
}

/*
type Props = NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>
export const OldSearchScreen = withAuthRequired(
  observer(function SearchScreenImpl({navigation, route}: Props) {
    const store = useStores()
    const params = route.params || {}
    const foafs = React.useMemo<FoafsModel>(
      () => new FoafsModel(store),
      [store],
    )
    const suggestedActors = React.useMemo<SuggestedActorsModel>(
      () => new SuggestedActorsModel(store),
      [store],
    )
    const searchUIModel = React.useMemo<SearchUIModel | undefined>(
      () => (params.q ? new SearchUIModel(store) : undefined),
      [params.q, store],
    )

    React.useEffect(() => {
      if (params.q && searchUIModel) {
        searchUIModel.fetch(params.q)
      }
      if (!foafs.hasData) {
        foafs.fetch()
      }
      if (!suggestedActors.hasLoaded) {
        suggestedActors.loadMore(true)
      }
    }, [foafs, suggestedActors, searchUIModel, params.q])

    const {isDesktop} = useWebMediaQueries()

    if (searchUIModel) {
      return (
        <View style={styles.scrollContainer}>
          <SearchResults model={searchUIModel} />
        </View>
      )
    }

    if (!isDesktop) {
      return (
        <CenteredView style={styles.scrollContainer}>
          <Mobile.SearchScreen navigation={navigation} route={route} />
        </CenteredView>
      )
    }

    return <Suggestions foafs={foafs} suggestedActors={suggestedActors} />
  }),
)

 */
const styles = StyleSheet.create({
  scrollContainer: {
    height: '100%',
    overflowY: 'auto',
  },
  heading: {
    fontWeight: 'bold',
  },
})
