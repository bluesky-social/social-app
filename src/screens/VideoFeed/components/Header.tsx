import {View} from 'react-native'

import {sanitizeHandle} from '#/lib/strings/handles'
import {useFeedSourceInfoQuery} from '#/state/queries/feed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {VideoFeedSourceContext} from '#/screens/VideoFeed/types'
import {atoms as a, useBreakpoints} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function HeaderPlaceholder() {
  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
      <View
        style={[
          a.rounded_sm,
          {
            width: 36,
            height: 36,
            backgroundColor: 'white',
            opacity: 0.8,
          },
        ]}
      />

      <View style={[a.flex_1, a.gap_xs]}>
        <View
          style={[
            a.w_full,
            a.rounded_xs,
            {
              backgroundColor: 'white',
              height: 14,
              width: 80,
              opacity: 0.8,
            },
          ]}
        />
        <View
          style={[
            a.w_full,
            a.rounded_xs,
            {
              backgroundColor: 'white',
              height: 10,
              width: 140,
              opacity: 0.6,
            },
          ]}
        />
      </View>
    </View>
  )
}

export function Header({
  sourceContext,
}: {
  sourceContext: VideoFeedSourceContext
}) {
  let content = null
  switch (sourceContext.type) {
    case 'feedgen': {
      content = <FeedHeader sourceContext={sourceContext} />
      break
    }
    case 'author':
    // TODO
    default: {
      break
    }
  }

  return (
    <Layout.Header.Outer noBottomBorder>
      <Layout.Header.BackButton />
      <Layout.Header.Content align="left">{content}</Layout.Header.Content>
    </Layout.Header.Outer>
  )
}

export function FeedHeader({
  sourceContext,
}: {
  sourceContext: Exclude<VideoFeedSourceContext, {type: 'author'}>
}) {
  const {gtMobile} = useBreakpoints()

  const {
    data: info,
    isLoading,
    error,
  } = useFeedSourceInfoQuery({uri: sourceContext.uri})

  if (isLoading) {
    return <HeaderPlaceholder />
  } else if (error || !info) {
    return null
  }

  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
      {info.avatar && <UserAvatar size={36} type="algo" avatar={info.avatar} />}

      <View style={[a.flex_1]}>
        <Text
          style={[
            a.text_md,
            a.font_heavy,
            a.leading_tight,
            gtMobile && a.text_lg,
          ]}
          numberOfLines={2}>
          {info.displayName}
        </Text>
        <View style={[a.flex_row, {gap: 6}]}>
          <Text
            style={[a.flex_shrink, a.text_sm, a.leading_snug]}
            numberOfLines={1}>
            {sanitizeHandle(info.creatorHandle, '@')}
          </Text>
        </View>
      </View>
    </View>
  )
}
