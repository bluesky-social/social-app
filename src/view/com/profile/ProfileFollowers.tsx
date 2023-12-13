import React from 'react'
import {ActivityIndicator, RefreshControl, StyleSheet, View} from 'react-native'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {CenteredView} from '../util/Views'
import {List} from '../util/List'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ProfileCardWithFollowBtn} from './ProfileCard'
import {usePalette} from 'lib/hooks/usePalette'
import {useProfileFollowersQuery} from '#/state/queries/profile-followers'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {logger} from '#/logger'
import {cleanError} from '#/lib/strings/errors'

export function ProfileFollowers({name}: {name: string}) {
  const pal = usePalette('default')
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {
    data: resolvedDid,
    error: resolveError,
    isFetching: isFetchingDid,
  } = useResolveDidQuery(name)
  const {
    data,
    isFetching,
    isFetched,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useProfileFollowersQuery(resolvedDid)

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
      logger.error('Failed to refresh followers', {error: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more followers', {error: err})
    }
  }

  const renderItem = React.useCallback(
    ({item}: {item: ActorDefs.ProfileViewBasic}) => (
      <ProfileCardWithFollowBtn key={item.did} profile={item} />
    ),
    [],
  )

  if (isFetchingDid || !isFetched) {
    return (
      <CenteredView>
        <ActivityIndicator />
      </CenteredView>
    )
  }

  // error
  // =
  if (resolveError || isError) {
    return (
      <CenteredView>
        <ErrorMessage
          message={cleanError(resolveError || error)}
          onPressTryAgain={onRefresh}
        />
      </CenteredView>
    )
  }

  // loaded
  // =
  return (
    <List
      data={followers}
      keyExtractor={item => item.did}
      refreshControl={
        <RefreshControl
          refreshing={isPTRing}
          onRefresh={onRefresh}
          tintColor={pal.colors.text}
          titleColor={pal.colors.text}
        />
      }
      onEndReached={onEndReached}
      renderItem={renderItem}
      initialNumToRender={15}
      // FIXME(dan)
      // eslint-disable-next-line react/no-unstable-nested-components
      ListFooterComponent={() => (
        <View style={styles.footer}>
          {(isFetching || isFetchingNextPage) && <ActivityIndicator />}
        </View>
      )}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
    />
  )
}

const styles = StyleSheet.create({
  footer: {
    height: 200,
    paddingTop: 20,
  },
})
