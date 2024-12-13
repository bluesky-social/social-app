import {useCallback, useMemo} from 'react'
import {ActivityIndicator, FlatList, View} from 'react-native'
import {AppBskyFeedGetLikes as GetLikes} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useLikedByQuery} from '#/state/queries/post-liked-by'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

interface LikesDialogProps {
  control: Dialog.DialogOuterProps['control']
  uri: string
}

export function LikesDialog(props: LikesDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />
      <LikesDialogInner {...props} />
    </Dialog.Outer>
  )
}

export function LikesDialogInner({control, uri}: LikesDialogProps) {
  const {_} = useLingui()
  const t = useTheme()

  const {
    data: resolvedUri,
    error: resolveError,
    isFetched: hasFetchedResolvedUri,
  } = useResolveUriQuery(uri)
  const {
    data,
    isFetching: isFetchingLikedBy,
    isFetched: hasFetchedLikedBy,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error: likedByError,
  } = useLikedByQuery(resolvedUri?.uri)

  const isLoading = !hasFetchedResolvedUri || !hasFetchedLikedBy
  const likes = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.likes)
    }
    return []
  }, [data])

  const onEndReached = useCallback(async () => {
    if (isFetchingLikedBy || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more likes', {message: err})
    }
  }, [isFetchingLikedBy, hasNextPage, isError, fetchNextPage])

  const renderItem = useCallback(
    ({item}: {item: GetLikes.Like}) => {
      return (
        <ProfileCardWithFollowBtn
          key={item.actor.did}
          profile={item.actor}
          onPress={() => control.close()}
        />
      )
    },
    [control],
  )

  return (
    <Dialog.Inner label={_(msg`Users that have liked this content or profile`)}>
      <Text style={[a.text_2xl, a.font_bold, a.leading_tight, a.pb_lg]}>
        <Trans>Liked by</Trans>
      </Text>

      {isLoading ? (
        <View style={{minHeight: 300}}>
          <Loader size="xl" />
        </View>
      ) : resolveError || likedByError || !data ? (
        <ErrorMessage message={cleanError(resolveError || likedByError)} />
      ) : likes.length === 0 ? (
        <View style={[t.atoms.bg_contrast_50, a.px_md, a.py_xl, a.rounded_md]}>
          <Text style={[a.text_center]}>
            <Trans>
              Nobody has liked this yet. Maybe you should be the first!
            </Trans>
          </Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          keyExtractor={item => item.actor.did}
          onEndReached={onEndReached}
          renderItem={renderItem}
          initialNumToRender={15}
          ListFooterComponent={
            <ListFooterComponent isFetching={isFetchingNextPage} />
          }
        />
      )}

      <Dialog.Close />
    </Dialog.Inner>
  )
}

function ListFooterComponent({isFetching}: {isFetching: boolean}) {
  if (isFetching) {
    return (
      <View style={a.pt_lg}>
        <ActivityIndicator />
      </View>
    )
  }
  return null
}
