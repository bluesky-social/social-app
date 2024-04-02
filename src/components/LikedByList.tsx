import React from 'react'
import {View} from 'react-native'
import {AppBskyFeedGetLikes as GetLikes} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {logger} from '#/logger'
import {useLikedByQuery} from '#/state/queries/post-liked-by'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {useInitialNumToRender} from 'lib/hooks/useInitialNumToRender'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function LikedByList({uri}: {uri: string}) {
  const t = useTheme()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {
    data: resolvedUri,
    error: resolveError,
    isFetching: isFetchingResolvedUri,
  } = useResolveUriQuery(uri)
  const {
    data,
    isFetching,
    isFetched,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isError,
    error: likedByError,
    refetch,
  } = useLikedByQuery(resolvedUri?.uri)
  const likes = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.likes)
    }
    return []
  }, [data])
  const initialNumToRender = useInitialNumToRender()
  const error = resolveError || likedByError

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh likes', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more likes', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const renderItem = React.useCallback(({item}: {item: GetLikes.Like}) => {
    return (
      <ProfileCardWithFollowBtn key={item.actor.did} profile={item.actor} />
    )
  }, [])

  if (isFetchingResolvedUri || !isFetched) {
    return (
      <View style={[a.w_full, a.align_center, a.p_lg]}>
        <Loader size="xl" />
      </View>
    )
  }

  return likes.length ? (
    <List
      data={likes}
      keyExtractor={item => item.actor.did}
      refreshing={isPTRing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={3}
      renderItem={renderItem}
      initialNumToRender={initialNumToRender}
      ListFooterComponent={() => (
        <ListFooter
          isFetching={isFetching && !isRefetching}
          isError={isError}
          error={error ? error.toString() : undefined}
          onRetry={fetchNextPage}
        />
      )}
    />
  ) : (
    <View style={[a.p_lg]}>
      <View style={[a.p_lg, a.rounded_sm, t.atoms.bg_contrast_25]}>
        <Text style={[a.text_md, a.leading_snug]}>
          <Trans>
            Nobody has liked this yet. Maybe you should be the first!
          </Trans>
        </Text>
      </View>
    </View>
  )
}
