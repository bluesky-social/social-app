import React, {useCallback, useMemo, useState} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {AppBskyFeedGetLikes as GetLikes} from '@atproto/api'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useLikedByQuery} from '#/state/queries/post-liked-by'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {List} from '../util/List'
import {LoadingScreen} from '../util/LoadingScreen'
import {CenteredView} from '../util/Views'

export function PostLikedBy({uri}: {uri: string}) {
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
  } = useLikedByQuery(resolvedUri?.uri)
  const likes = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.likes)
    }
  }, [data])

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh likes', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more likes', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const renderItem = useCallback(({item}: {item: GetLikes.Like}) => {
    return (
      <ProfileCardWithFollowBtn key={item.actor.did} profile={item.actor} />
    )
  }, [])

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
      data={likes}
      keyExtractor={item => item.actor.did}
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
