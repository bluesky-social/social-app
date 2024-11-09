import React from 'react'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useSession} from '#/state/session'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {List} from '../util/List'
import {ProfileCardWithFollowBtn} from './ProfileCard'

function renderItem({
  item,
  index,
}: {
  item: ActorDefs.ProfileViewBasic
  index: number
}) {
  return (
    <ProfileCardWithFollowBtn
      key={item.did}
      profile={item}
      noBorder={index === 0 && !isWeb}
    />
  )
}

function keyExtractor(item: ActorDefs.ProfileViewBasic) {
  return item.did
}

export function ProfileFollows({name}: {name: string}) {
  const {_} = useLingui()
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
    isLoading: isFollowsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useProfileFollowsQuery(resolvedDid)

  const isError = !!resolveError || !!error
  const isMe = resolvedDid === currentAccount?.did

  const follows = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.follows)
    }
    return []
  }, [data])

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh follows', {error: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || !!error) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more follows', {error: err})
    }
  }, [error, fetchNextPage, hasNextPage, isFetchingNextPage])

  if (follows.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isDidLoading || isFollowsLoading}
        isError={isError}
        emptyType="results"
        emptyMessage={
          isMe
            ? _(msg`You are not following anyone.`)
            : _(msg`This user isn't following anyone.`)
        }
        errorMessage={cleanError(resolveError || error)}
        onRetry={isError ? refetch : undefined}
        sideBorders={false}
      />
    )
  }

  return (
    <List
      data={follows}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={4}
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
