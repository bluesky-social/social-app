import React, {useMemo, useCallback, useState} from 'react'
import {ActivityIndicator, RefreshControl, StyleSheet, View} from 'react-native'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {CenteredView} from '../util/Views'
import {List} from '../util/List'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {usePalette} from 'lib/hooks/usePalette'
import {logger} from '#/logger'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {usePostRepostedByQuery} from '#/state/queries/post-reposted-by'
import {cleanError} from '#/lib/strings/errors'

export function PostRepostedBy({uri}: {uri: string}) {
  const pal = usePalette('default')
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
      logger.error('Failed to refresh reposts', {error: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more reposts', {error: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const renderItem = useCallback(
    ({item}: {item: ActorDefs.ProfileViewBasic}) => {
      return <ProfileCardWithFollowBtn key={item.did} profile={item} />
    },
    [],
  )

  if (isFetchingResolvedUri || !isFetched) {
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
      data={repostedBy}
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
