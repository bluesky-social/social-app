import React from 'react'
import {StyleSheet, View} from 'react-native'
import {PostsFeedSliceModel} from 'state/models/feeds/posts'
import {AtUri} from '@atproto/api'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import Svg, {Circle, Line} from 'react-native-svg'
import {FeedItem} from './FeedItem'
import {usePalette} from 'lib/hooks/usePalette'
import {ModerationBehaviorCode} from 'lib/labeling/types'

export function FeedSlice({
  slice,
  showFollowBtn,
  ignoreMuteFor,
}: {
  slice: PostsFeedSliceModel
  showFollowBtn?: boolean
  ignoreMuteFor?: string
}) {
  if (slice.moderation.list.behavior === ModerationBehaviorCode.Hide) {
    return null
  }
  if (slice.isThread && slice.items.length > 3) {
    const last = slice.items.length - 1
    return (
      <>
        <FeedItem
          key={slice.items[0]._reactKey}
          item={slice.items[0]}
          isThreadParent={slice.isThreadParentAt(0)}
          isThreadChild={slice.isThreadChildAt(0)}
          showFollowBtn={showFollowBtn}
          ignoreMuteFor={ignoreMuteFor}
        />
        <FeedItem
          key={slice.items[1]._reactKey}
          item={slice.items[1]}
          isThreadParent={slice.isThreadParentAt(1)}
          isThreadChild={slice.isThreadChildAt(1)}
          showFollowBtn={showFollowBtn}
          ignoreMuteFor={ignoreMuteFor}
        />
        <ViewFullThread slice={slice} />
        <FeedItem
          key={slice.items[last]._reactKey}
          item={slice.items[last]}
          isThreadParent={slice.isThreadParentAt(last)}
          isThreadChild={slice.isThreadChildAt(last)}
          showFollowBtn={showFollowBtn}
          ignoreMuteFor={ignoreMuteFor}
        />
      </>
    )
  }

  return (
    <>
      {slice.items.map((item, i) => (
        <FeedItem
          key={item._reactKey}
          item={item}
          isThreadParent={slice.isThreadParentAt(i)}
          isThreadChild={slice.isThreadChildAt(i)}
          showFollowBtn={showFollowBtn}
          ignoreMuteFor={ignoreMuteFor}
        />
      ))}
    </>
  )
}

function ViewFullThread({slice}: {slice: PostsFeedSliceModel}) {
  const pal = usePalette('default')
  const itemHref = React.useMemo(() => {
    const urip = new AtUri(slice.rootItem.post.uri)
    return `/profile/${slice.rootItem.post.author.handle}/post/${urip.rkey}`
  }, [slice.rootItem.post.uri, slice.rootItem.post.author.handle])

  return (
    <Link style={[pal.view, styles.viewFullThread]} href={itemHref} noFeedback>
      <View style={styles.viewFullThreadDots}>
        <Svg width="4" height="30">
          <Line
            x1="2"
            y1="0"
            x2="2"
            y2="8"
            stroke={pal.colors.replyLine}
            strokeWidth="2"
          />
          <Circle cx="2" cy="16" r="1.5" fill={pal.colors.replyLineDot} />
          <Circle cx="2" cy="22" r="1.5" fill={pal.colors.replyLineDot} />
          <Circle cx="2" cy="28" r="1.5" fill={pal.colors.replyLineDot} />
        </Svg>
      </View>
      <Text type="md" style={pal.link}>
        View full thread
      </Text>
    </Link>
  )
}

const styles = StyleSheet.create({
  viewFullThread: {
    paddingTop: 14,
    paddingBottom: 6,
    paddingLeft: 80,
  },
  viewFullThreadDots: {
    position: 'absolute',
    left: 41,
    top: 0,
  },
})
