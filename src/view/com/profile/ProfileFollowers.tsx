import React from 'react'
import {type AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileFollowersQuery} from '#/state/queries/profile-followers'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useSession} from '#/state/session'
import {PeopleRemove2_Stroke1_Corner0_Rounded as PeopleRemoveIcon} from '#/components/icons/PeopleRemove2'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {useAnalytics} from '#/analytics'
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

function keyExtractor(item: ActorDefs.ProfileViewBasic) {
  return item.did
}

export function ProfileFollowers({name}: {name: string}) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const navigation = useNavigation()
  const initialNumToRender = useInitialNumToRender()
  const {currentAccount} = useSession()

  const [isPTRing, setIsPTRing] = React.useState(false)
  const {
    data: resolvedDid,
    isLoading: isDidLoading,
    error: resolveError,
  } = useResolveDidQuery(name)
  const {
    data,
    isLoading: isFollowersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useProfileFollowersQuery(resolvedDid)

  const isError = !!resolveError || !!error
  const isMe = resolvedDid === currentAccount?.did

  const followers = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.followers)
    }
    return []
  }, [data])

  // Track pagination events - fire for page 3+ (pages 1-2 may auto-load)
  const paginationTrackingRef = React.useRef<{
    did: string | undefined
    page: number
  }>({did: undefined, page: 0})
  React.useEffect(() => {
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
      ax.metric('profile:followers:paginate', {
        contextProfileDid: resolvedDid,
        itemCount: followers.length,
        page: currentPageCount,
      })
    }
    paginationTrackingRef.current.page = currentPageCount
  }, [ax, data?.pages?.length, resolvedDid, followers.length])

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh followers', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || !!error) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more followers', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  const renderItemWithContext = React.useCallback(
    ({item, index}: {item: ActorDefs.ProfileView; index: number}) =>
      renderItem({item, index, contextProfileDid: resolvedDid}),
    [resolvedDid],
  )

  // track pageview
  React.useEffect(() => {
    if (resolvedDid) {
      ax.metric('profile:followers:view', {
        contextProfileDid: resolvedDid,
        isOwnProfile: isMe,
      })
    }
  }, [ax, resolvedDid, isMe])

  // track seen items
  const seenItemsRef = React.useRef<Set<string>>(new Set())
  React.useEffect(() => {
    seenItemsRef.current.clear()
  }, [resolvedDid])
  const onItemSeen = React.useCallback(
    (item: ActorDefs.ProfileView) => {
      if (seenItemsRef.current.has(item.did)) {
        return
      }
      seenItemsRef.current.add(item.did)
      const position = followers.findIndex(p => p.did === item.did) + 1
      if (position === 0) {
        return
      }
      ax.metric('profileCard:seen', {
        profileDid: item.did,
        position,
        ...(resolvedDid !== undefined && {contextProfileDid: resolvedDid}),
      })
    },
    [ax, followers, resolvedDid],
  )

  if (followers.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isDidLoading || isFollowersLoading}
        isError={isError}
        emptyType="results"
        emptyMessage={
          isMe
            ? _(msg`No followers yet`)
            : _(msg`This user doesn't have any followers.`)
        }
        errorMessage={cleanError(resolveError || error)}
        onRetry={isError ? refetch : undefined}
        sideBorders={false}
        useEmptyState={true}
        emptyStateIcon={PeopleRemoveIcon}
        emptyStateButton={{
          label: _(msg`Go back`),
          text: _(msg`Go back`),
          color: 'secondary',
          size: 'small',
          onPress: () => navigation.goBack(),
        }}
      />
    )
  }

  return (
    <List
      data={followers}
      renderItem={renderItemWithContext}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={4}
      onItemSeen={onItemSeen}
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
