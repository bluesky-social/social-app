import React, {memo} from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Circle, Line} from 'react-native-svg'
import {AtUri} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {FeedPostSlice} from '#/state/queries/post-feed'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {FeedItem} from './FeedItem'

let FeedSlice = ({
  slice,
  hideTopBorder,
}: {
  slice: FeedPostSlice
  hideTopBorder?: boolean
}): React.ReactNode => {
  if (slice.isThread && slice.items.length > 3) {
    const last = slice.items.length - 1
    return (
      <>
        <FeedItem
          key={slice.items[0]._reactKey}
          post={slice.items[0].post}
          record={slice.items[0].record}
          reason={slice.items[0].reason}
          feedContext={slice.items[0].feedContext}
          parentAuthor={slice.items[0].parentAuthor}
          showReplyTo={true}
          moderation={slice.items[0].moderation}
          isThreadParent={isThreadParentAt(slice.items, 0)}
          isThreadChild={isThreadChildAt(slice.items, 0)}
          hideTopBorder={hideTopBorder}
          isParentBlocked={slice.items[0].isParentBlocked}
        />
        <FeedItem
          key={slice.items[1]._reactKey}
          post={slice.items[1].post}
          record={slice.items[1].record}
          reason={slice.items[1].reason}
          feedContext={slice.items[1].feedContext}
          parentAuthor={slice.items[1].parentAuthor}
          showReplyTo={false}
          moderation={slice.items[1].moderation}
          isThreadParent={isThreadParentAt(slice.items, 1)}
          isThreadChild={isThreadChildAt(slice.items, 1)}
          isParentBlocked={slice.items[1].isParentBlocked}
        />
        <ViewFullThread slice={slice} />
        <FeedItem
          key={slice.items[last]._reactKey}
          post={slice.items[last].post}
          record={slice.items[last].record}
          reason={slice.items[last].reason}
          feedContext={slice.items[last].feedContext}
          parentAuthor={slice.items[2].parentAuthor}
          showReplyTo={false}
          moderation={slice.items[last].moderation}
          isThreadParent={isThreadParentAt(slice.items, last)}
          isThreadChild={isThreadChildAt(slice.items, last)}
          isParentBlocked={slice.items[2].isParentBlocked}
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
          post={slice.items[i].post}
          record={slice.items[i].record}
          reason={slice.items[i].reason}
          feedContext={slice.items[i].feedContext}
          moderation={slice.items[i].moderation}
          parentAuthor={slice.items[i].parentAuthor}
          showReplyTo={i === 0}
          isThreadParent={isThreadParentAt(slice.items, i)}
          isThreadChild={isThreadChildAt(slice.items, i)}
          isThreadLastChild={
            isThreadChildAt(slice.items, i) && slice.items.length === i + 1
          }
          isParentBlocked={slice.items[i].isParentBlocked}
          hideTopBorder={hideTopBorder && i === 0}
        />
      ))}
    </>
  )
}
FeedSlice = memo(FeedSlice)
export {FeedSlice}

function ViewFullThread({slice}: {slice: FeedPostSlice}) {
  const pal = usePalette('default')
  const itemHref = React.useMemo(() => {
    const urip = new AtUri(slice.rootUri)
    return makeProfileLink({did: urip.hostname, handle: ''}, 'post', urip.rkey)
  }, [slice.rootUri])

  return (
    <Link style={[styles.viewFullThread]} href={itemHref} asAnchor noFeedback>
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
        <Trans>View full thread</Trans>
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

function isThreadParentAt<T>(arr: Array<T>, i: number) {
  if (arr.length === 1) {
    return false
  }
  return i < arr.length - 1
}

function isThreadChildAt<T>(arr: Array<T>, i: number) {
  if (arr.length === 1) {
    return false
  }
  return i > 0
}
