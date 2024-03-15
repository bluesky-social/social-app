import React from 'react'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {List} from '../util/List'
import {ProfileCardWithFollowBtn} from './ProfileCard'
import {useProfileFollowersQuery} from '#/state/queries/profile-followers'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {logger} from '#/logger'
import {cleanError} from '#/lib/strings/errors'
import {useInitialNumToRender} from 'lib/hooks/useInitialNumToRender'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSession} from 'state/session'

function renderItem({item}: {item: ActorDefs.ProfileViewBasic}) {
  return <ProfileCardWithFollowBtn key={item.did} profile={item} />
}

function keyExtractor(item: ActorDefs.ProfileViewBasic) {
  return item.did
}

export function ProfileFollowers({name}: {name: string}) {
  const {_} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const {currentAccount} = useSession()

  const [isPTRing, setIsPTRing] = React.useState(false)
  const {data: resolvedDid, error: resolveError} = useResolveDidQuery(name)
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useProfileFollowersQuery(resolvedDid)

  const isMe = React.useMemo(() => {
    return resolvedDid === currentAccount?.did
  }, [resolvedDid, currentAccount?.did])

  const followers = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.followers)
    }
  }, [data])

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh followers', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = async () => {
    if (isFetching || !hasNextPage || !!error) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more followers', {message: err})
    }
  }

  return (
    <>
      <ListMaybePlaceholder
        isLoading={isLoading}
        isEmpty={!followers}
        isError={!!resolveError || !!error}
        emptyType="results"
        emptyMessage={
          isMe
            ? _(msg`You do not have any followers.`)
            : _(msg`This user doesn't have any followers.`)
        }
        errorMessage={cleanError(resolveError || error)}
        onRetry={refetch}
      />
      {followers && (
        <List
          data={followers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTRing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          initialNumToRender={initialNumToRender}
          onEndReachedThreshold={4}
          ListFooterComponent={<ListFooter isFetching={isFetchingNextPage} />}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
      )}
    </>
  )
}
