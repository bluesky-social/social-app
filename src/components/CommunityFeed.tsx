import React from 'react'
import {ActivityIndicator, View} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {useCommunityFeedQuery} from '#/state/queries/community-feed'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme} from '#/alf'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

export function CommunityFeed({actor}: {actor: string}) {
  const t = useTheme()
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCommunityFeedQuery(actor)

  if (isLoading) {
    return (
      <View style={[a.py_xl, a.align_center]}>
        <ActivityIndicator />
      </View>
    )
  }

  if (isError) {
    return (
      <View style={[a.py_xl, a.align_center]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>Failed to load community posts</Trans>
        </Text>
      </View>
    )
  }

  const feedItems = data?.pages.flatMap(page => page.feed) || []

  if (feedItems.length === 0) {
    return (
      <View style={[a.py_xl, a.align_center]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>No community posts yet</Trans>
        </Text>
      </View>
    )
  }

  return (
    <View>
      <View style={[a.px_lg, a.py_sm, a.border_b, t.atoms.border_contrast_low]}>
        <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
          <Trans>Blacksky Community Posts</Trans>
        </Text>
      </View>
      {feedItems.map(item => (
        <CommunityPostItem key={item.post.uri} postView={item.post} />
      ))}
      {hasNextPage && (
        <View style={[a.py_md, a.align_center]}>
          {isFetchingNextPage ? (
            <ActivityIndicator />
          ) : (
            <Text
              style={[a.text_sm, t.atoms.text_contrast_medium]}
              onPress={() => fetchNextPage()}>
              <Trans>Load more</Trans>
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export function CommunityPostItem({
  postView,
}: {
  postView: AppBskyFeedDefs.PostView
}) {
  const t = useTheme()
  const record = postView.record as AppBskyFeedPost.Record
  const rt = React.useMemo(() => {
    const richText = new RichTextAPI({
      text: record.text,
      facets: record.facets,
    })
    return richText
  }, [record.text, record.facets])

  return (
    <View style={[a.px_lg, a.py_md, a.border_b, t.atoms.border_contrast_low]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs, a.mb_xs]}>
        <View
          style={[
            a.px_xs,
            a.py_2xs,
            a.rounded_xs,
            {backgroundColor: t.palette.primary_500},
          ]}>
          <Text style={[a.text_2xs, {color: 'white'}]}>Community</Text>
        </View>
        <TimeElapsed timestamp={record.createdAt}>
          {({timeElapsed}) => (
            <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
              {timeElapsed}
            </Text>
          )}
        </TimeElapsed>
        {(postView.replyCount ?? 0) > 0 && (
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {postView.replyCount} replies
          </Text>
        )}
      </View>
      <RichText value={rt} style={[a.text_md]} />
    </View>
  )
}
