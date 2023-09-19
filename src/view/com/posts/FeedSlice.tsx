import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {PostsFeedSliceModel} from 'state/models/feeds/posts-slice'
import {AtUri} from '@atproto/api'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import Svg, {Circle, Line} from 'react-native-svg'
import {FeedItem} from './FeedItem'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'

export const FeedSlice = observer(function FeedSliceImpl({
  slice,
  ignoreFilterFor,
}: {
  slice: PostsFeedSliceModel
  ignoreFilterFor?: string
}) {
  if (slice.shouldFilter(ignoreFilterFor)) {
    return null
  }

  if (slice.isThread && slice.items.length > 3) {
    const last = slice.items.length - 1
    return (
      <>
        <FeedItem
          key={slice.items[0]._reactKey}
          item={slice.items[0]}
          source={slice.source}
          isThreadParent={slice.isThreadParentAt(0)}
          isThreadChild={slice.isThreadChildAt(0)}
        />
        <FeedItem
          key={slice.items[1]._reactKey}
          item={slice.items[1]}
          isThreadParent={slice.isThreadParentAt(1)}
          isThreadChild={slice.isThreadChildAt(1)}
        />
        <ViewFullThread slice={slice} />
        <FeedItem
          key={slice.items[last]._reactKey}
          item={slice.items[last]}
          isThreadParent={slice.isThreadParentAt(last)}
          isThreadChild={slice.isThreadChildAt(last)}
          isThreadLastChild
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
          source={i === 0 ? slice.source : undefined}
          isThreadParent={slice.isThreadParentAt(i)}
          isThreadChild={slice.isThreadChildAt(i)}
          isThreadLastChild={
            slice.isThreadChildAt(i) && slice.items.length === i + 1
          }
        />
      ))}
    </>
  )
})

function ViewFullThread({slice}: {slice: PostsFeedSliceModel}) {
  const pal = usePalette('default')
  const itemHref = React.useMemo(() => {
    const urip = new AtUri(slice.rootItem.post.uri)
    return makeProfileLink(slice.rootItem.post.author, 'post', urip.rkey)
  }, [slice.rootItem.post.uri, slice.rootItem.post.author])

  return (
    <Link
      style={[pal.view, styles.viewFullThread]}
      href={itemHref}
      asAnchor
      noFeedback>
      <View style={styles.viewFullThreadDots}>
        <Svg width="4" height="40">
          <Line
            x1="2"
            y1="0"
            x2="2"
            y2="15"
            stroke={pal.colors.replyLine}
            strokeWidth="2"
          />
          <Circle cx="2" cy="22" r="1.5" fill={pal.colors.replyLineDot} />
          <Circle cx="2" cy="28" r="1.5" fill={pal.colors.replyLineDot} />
          <Circle cx="2" cy="34" r="1.5" fill={pal.colors.replyLineDot} />
        </Svg>
      </View>

      <Text type="md" style={[pal.link, {paddingTop: 18, paddingBottom: 4}]}>
        View full thread
      </Text>
    </Link>
  )
}

const styles = StyleSheet.create({
  viewFullThread: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 18,
  },
  viewFullThreadDots: {
    width: 52,
    alignItems: 'center',
  },
})
