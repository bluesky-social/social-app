import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileFollowersQuery} from '#/state/queries/profile-followers'
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

export function ProfileFollowers({name}: {name: string}) {
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
    isLoading: isFollowersLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useProfileFollowersQuery(resolvedDid)

  const isError = React.useMemo(
    () => !!resolveError || !!error,
    [resolveError, error],
  )

  const isMe = React.useMemo(() => {
    return resolvedDid === currentAccount?.did
  }, [resolvedDid, currentAccount?.did])

  const followers = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.followers)
    }
    return []
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
    <View style={{flex: 1}}>
      <ListMaybePlaceholder
        isLoading={isDidLoading || isFollowersLoading}
        isEmpty={followers.length < 1}
        isError={isError}
        emptyType="results"
        emptyMessage={
          isMe
            ? _(msg`You do not have any followers.`)
            : _(msg`This user doesn't have any followers.`)
        }
        errorMessage={cleanError(resolveError || error)}
        onRetry={isError ? refetch : undefined}
      />
      {followers.length > 0 && (
        <List
          data={followers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTRing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={4}
          ListHeaderComponent={<ListHeaderDesktop title={_(msg`Followers`)} />}
          ListFooterComponent={<ListFooter isFetching={isFetchingNextPage} />}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
          initialNumToRender={initialNumToRender}
          windowSize={11}
        />
      )}
    </View>
  )
}
