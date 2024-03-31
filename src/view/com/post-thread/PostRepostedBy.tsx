import React, {useCallback, useMemo, useState} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {usePostRepostedByQuery} from '#/state/queries/post-reposted-by'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {List} from '../util/List'
import {LoadingScreen} from '../util/LoadingScreen'
import {CenteredView} from '../util/Views'

export function PostRepostedBy({uri}: {uri: string}) {
  const [isPTRing, setIsPTRing] = useState(false)
  const {
    data: resolvedUri,
    error: resolveError,
    isFetching: isFetchingResolvedUri,
  } = useResolveUriQuery(uri)
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
  } = usePostRepostedByQuery(resolvedUri?.uri)
  const repostedBy = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.repostedBy)
    }
  }, [data])

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh reposts', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more reposts', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const renderItem = useCallback(
    ({item}: {item: ActorDefs.ProfileViewBasic}) => {
      return <ProfileCardWithFollowBtn key={item.did} profile={item} />
    },
    [],
  )

  if (isFetchingResolvedUri || !isFetched) {
    return <LoadingScreen />
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
      data={repostedBy}
      keyExtractor={item => item.did}
      refreshing={isPTRing}
      onRefresh={onRefresh}
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
