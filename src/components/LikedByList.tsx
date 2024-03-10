import React from 'react'
import {View} from 'react-native'
import {AppBskyFeedGetLikes as GetLikes} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {List} from '#/view/com/util/List'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {useLikedByQuery} from '#/state/queries/post-liked-by'
import {cleanError} from '#/lib/strings/errors'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Refresh} from './icons/ArrowRotateCounterClockwise'

import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'

export function LikedByList({uri}: {uri: string}) {
  const t = useTheme()
  const {_} = useLingui()
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
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useLikedByQuery(resolvedUri?.uri)
  const likes = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.likes)
    }
    return []
  }, [data])

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

  if (resolveError || isError) {
    return (
      <View style={[a.p_lg]}>
        <View style={[a.p_lg, a.rounded_sm, t.atoms.bg_contrast_25]}>
          <Text style={[a.text_md, a.pb_lg]}>
            {cleanError(resolveError || error)}
          </Text>

          <View style={[a.flex_row, a.justify_end]}>
            <Button
              label={_(msg``)}
              onPress={onRefresh}
              size="small"
              variant="solid"
              color="primary">
              <ButtonText>
                <Trans>Try again</Trans>
              </ButtonText>
              <ButtonIcon icon={Refresh} position="right" />
            </Button>
          </View>
        </View>
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
      renderItem={renderItem}
      initialNumToRender={15}
      contentContainerStyle={{borderWidth: 0}}
      // FIXME(dan)
      // eslint-disable-next-line react/no-unstable-nested-components
      ListFooterComponent={() => (
        <View style={[a.w_full, a.align_center, a.p_lg]}>
          {(isFetching || isFetchingNextPage) && <Loader size="xl" />}
        </View>
      )}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
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
