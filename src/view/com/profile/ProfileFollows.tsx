import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {type NavigationProp} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useSession} from '#/state/session'
import {FindContactsBannerNUX} from '#/components/contacts/FindContactsBannerNUX'
import {PeopleRemove2_Stroke1_Corner0_Rounded as PeopleRemoveIcon} from '#/components/icons/PeopleRemove2'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {List} from '../util/List'
import {ProfileCardWithFollowBtn} from './ProfileCard'

function renderItem({
  item,
  index,
  contextProfileDid,
}: {
  item: ActorDefs.ProfileView
  index: number
  contextProfileDid: string | undefined
}) {
  return (
    <ProfileCardWithFollowBtn
      key={item.did}
      profile={item}
      noBorder={index === 0}
      position={index + 1}
      contextProfileDid={contextProfileDid}
    />
  )
}

function keyExtractor(item: ActorDefs.ProfileView) {
  return item.did
}

export function ProfileFollows({name}: {name: string}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const initialNumToRender = useInitialNumToRender()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()

  const isSortEnabled = ax.features.enabled(ax.features.FollowSortEnable)

  const onPressFindAccounts = useCallback(() => {
    if (IS_WEB) {
      navigation.navigate('Search', {})
    } else {
      navigation.navigate('SearchTab')
      navigation.popToTop()
    }
  }, [navigation])

  const [isPTRing, setIsPTRing] = useState(false)
  const {
    data: resolvedDid,
    isLoading: isDidLoading,
    error: resolveError,
  } = useResolveDidQuery(name)
  const isMe = resolvedDid === currentAccount?.did
  const sort = isMe ? 'latest' : 'top'
  const {
    data,
    isLoading: isFollowsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useProfileFollowsQuery(resolvedDid, {
    sort,
  })

  const isError = !!resolveError || !!error

  const follows = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.follows)
    }
    return []
  }, [data])

  // Track pagination events - fire for page 3+ (pages 1-2 may auto-load)
  const paginationTrackingRef = useRef<{
    did: string | undefined
    page: number
  }>({did: undefined, page: 0})
  useEffect(() => {
    const currentPageCount = data?.pages?.length || 0
    // Reset tracking when profile changes
    if (paginationTrackingRef.current.did !== resolvedDid) {
      paginationTrackingRef.current = {did: resolvedDid, page: currentPageCount}
      return
    }
    if (
      resolvedDid &&
      currentPageCount >= 3 &&
      currentPageCount > paginationTrackingRef.current.page
    ) {
      ax.metric('profile:following:paginate', {
        contextProfileDid: resolvedDid,
        itemCount: follows.length,
        page: currentPageCount,
        sort: isSortEnabled ? sort : undefined,
      })
    }
    paginationTrackingRef.current.page = currentPageCount
  }, [
    ax,
    data?.pages?.length,
    resolvedDid,
    follows.length,
    sort,
    isSortEnabled,
  ])

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh follows', {error: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || !!error) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more follows', {error: err})
    }
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  const renderItemWithContext = useCallback(
    ({item, index}: {item: ActorDefs.ProfileView; index: number}) =>
      renderItem({item, index, contextProfileDid: resolvedDid}),
    [resolvedDid],
  )

  // track pageview
  useEffect(() => {
    if (resolvedDid) {
      ax.metric('profile:following:view', {
        contextProfileDid: resolvedDid,
        isOwnProfile: isMe,
        sort: isSortEnabled ? sort : undefined,
      })
    }
  }, [ax, resolvedDid, isMe, sort, isSortEnabled])

  // track seen items
  const seenItemsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    seenItemsRef.current.clear()
  }, [resolvedDid])
  const onItemSeen = useCallback(
    (item: ActorDefs.ProfileView) => {
      if (seenItemsRef.current.has(item.did)) {
        return
      }
      seenItemsRef.current.add(item.did)
      const position = follows.findIndex(p => p.did === item.did) + 1
      if (position === 0) {
        return
      }
      ax.metric('profileCard:seen', {
        profileDid: item.did,
        position,
        ...(resolvedDid !== undefined && {contextProfileDid: resolvedDid}),
        sort: isSortEnabled ? sort : undefined,
      })
    },
    [ax, follows, resolvedDid, sort, isSortEnabled],
  )

  if (follows.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isDidLoading || isFollowsLoading}
        isError={isError}
        emptyType="results"
        emptyMessage={
          isMe
            ? l`You are not following anyone yet`
            : l`This user isn't following anyone.`
        }
        errorMessage={cleanError(resolveError || error)}
        onRetry={isError ? refetch : undefined}
        sideBorders={false}
        useEmptyState={true}
        emptyStateIcon={PeopleRemoveIcon}
        emptyStateButton={{
          label: l`See suggested accounts`,
          text: l`See suggested accounts`,
          onPress: onPressFindAccounts,
          size: 'tiny',
          color: 'primary',
        }}
      />
    )
  }

  return (
    <List
      data={follows}
      renderItem={renderItemWithContext}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
      onItemSeen={onItemSeen}
      ListHeaderComponent={<FindContactsBannerNUX />}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanError(error)}
          onRetry={fetchNextPage}
        />
      }
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
      initialNumToRender={initialNumToRender}
      windowSize={11}
      sideBorders={false}
    />
  )
}
