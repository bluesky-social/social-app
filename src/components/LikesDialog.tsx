import React, {useMemo, useCallback} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyFeedGetLikes as GetLikes} from '@atproto/api'
import {BottomSheetFlatList} from '@gorhom/bottom-sheet'

import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {useLikedByQuery} from '#/state/queries/post-liked-by'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {Button} from '#/components/Button'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'

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
  const {gtMobile} = useBreakpoints()

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
  } = useLikedByQuery(resolvedUri?.uri)
  const likes = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.likes)
    }
  }, [data])

  const onEndReached = useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more likes', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

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
    <Dialog.Inner
      accessibilityLabelledBy="dialog-title"
      accessibilityDescribedBy="">
      <Text
        nativeID="dialog-title"
        style={[a.text_2xl, a.font_bold, a.pb_md, a.leading_tight]}>
        <Trans>Liked by</Trans>
      </Text>
      {isFetchingResolvedUri || !isFetched ? (
        <ActivityIndicator />
      ) : resolveError || isError ? (
        <ErrorMessage message={cleanError(resolveError || error)} />
      ) : likes?.length === 0 ? (
        <View style={[t.atoms.bg_contrast_50, a.px_md, a.py_xl, a.rounded_md]}>
          <Text style={[a.text_center]}>
            <Trans>
              Nobody has liked this yet. Maybe you should be the first!
            </Trans>
          </Text>
        </View>
      ) : (
        <Dialog.FlatList
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
      <View style={[gtMobile && [a.flex_row, a.justify_end], a.mt_md]}>
        <Button
          testID="doneBtn"
          variant="outline"
          color="primary"
          size="small"
          onPress={() => control.close()}
          label={_(msg`Done`)}>
          {_(msg`Done`)}
        </Button>
      </View>
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
