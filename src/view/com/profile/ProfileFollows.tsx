import React from 'react'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useInitialNumToRender} from 'lib/hooks/useInitialNumToRender'
import {useSession} from 'state/session'
import {
  ListFooter,
  ListHeaderDesktop,
  ListMaybePlaceholder,
} from '#/components/Lists'
import {List} from '../util/List'
import {ProfileCardWithFollowBtn} from './ProfileCard'

function renderItem({item}: {item: ActorDefs.ProfileViewBasic}) {
  return <ProfileCardWithFollowBtn key={item.did} profile={item} />
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
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useProfileFollowsQuery(resolvedDid)

  const isError = React.useMemo(
    () => !!resolveError || !!error,
    [resolveError, error],
  )

  const isMe = React.useMemo(() => {
    return resolvedDid === currentAccount?.did
  }, [resolvedDid, currentAccount?.did])

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

  const onEndReached = async () => {
    if (isFetching || !hasNextPage || !!error) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more follows', {error: err})
    }
  }

  return (
    <>
      <ListMaybePlaceholder
        isLoading={isDidLoading || isFollowsLoading}
        isEmpty={follows.length < 1}
        isError={isError}
        emptyType="results"
        emptyMessage={
          isMe
            ? _(msg`You are not following anyone.`)
            : _(msg`This user isn't following anyone.`)
        }
        errorMessage={cleanError(resolveError || error)}
        onRetry={isError ? refetch : undefined}
      />
      {follows.length > 0 && (
        <List
          data={follows}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTRing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={4}
          ListHeaderComponent={<ListHeaderDesktop title={_(msg`Following`)} />}
          ListFooterComponent={<ListFooter isFetching={isFetchingNextPage} />}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
          initialNumToRender={initialNumToRender}
          windowSize={11}
        />
      )}
    </>
  )
}
