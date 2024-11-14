import React, {memo} from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Circle, Line} from 'react-native-svg'
import {AtUri} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {FeedPostSlice} from '#/state/queries/post-feed'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {SubtleWebHover} from '#/components/SubtleWebHover'
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
  if (slice.isIncompleteThread && slice.items.length >= 3) {
    const beforeLast = slice.items.length - 2
    const last = slice.items.length - 1
    return (
      <>
        <FeedItem
          key={slice.items[0]._reactKey}
          post={slice.items[0].post}
          record={slice.items[0].record}
          reason={slice.reason}
          feedContext={slice.feedContext}
          parentAuthor={slice.items[0].parentAuthor}
          showReplyTo={false}
          moderation={slice.items[0].moderation}
          isThreadParent={isThreadParentAt(slice.items, 0)}
          isThreadChild={isThreadChildAt(slice.items, 0)}
          hideTopBorder={hideTopBorder}
          isParentBlocked={slice.items[0].isParentBlocked}
          isParentNotFound={slice.items[0].isParentNotFound}
          rootPost={slice.items[0].post}
        />
        <ViewFullThread uri={slice.items[0].uri} />
        <FeedItem
          key={slice.items[beforeLast]._reactKey}
          post={slice.items[beforeLast].post}
          record={slice.items[beforeLast].record}
          reason={undefined}
          feedContext={slice.feedContext}
          parentAuthor={slice.items[beforeLast].parentAuthor}
          showReplyTo={
            slice.items[beforeLast].parentAuthor?.did !==
            slice.items[beforeLast].post.author.did
          }
          moderation={slice.items[beforeLast].moderation}
          isThreadParent={isThreadParentAt(slice.items, beforeLast)}
          isThreadChild={isThreadChildAt(slice.items, beforeLast)}
          isParentBlocked={slice.items[beforeLast].isParentBlocked}
          isParentNotFound={slice.items[beforeLast].isParentNotFound}
          rootPost={slice.items[0].post}
        />
        <FeedItem
          key={slice.items[last]._reactKey}
          post={slice.items[last].post}
          record={slice.items[last].record}
          reason={undefined}
          feedContext={slice.feedContext}
          parentAuthor={slice.items[last].parentAuthor}
          showReplyTo={false}
          moderation={slice.items[last].moderation}
          isThreadParent={isThreadParentAt(slice.items, last)}
          isThreadChild={isThreadChildAt(slice.items, last)}
          isParentBlocked={slice.items[last].isParentBlocked}
          isParentNotFound={slice.items[last].isParentNotFound}
          isThreadLastChild
          rootPost={slice.items[0].post}
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
          reason={i === 0 ? slice.reason : undefined}
          feedContext={slice.feedContext}
          moderation={slice.items[i].moderation}
          parentAuthor={slice.items[i].parentAuthor}
          showReplyTo={i === 0}
          isThreadParent={isThreadParentAt(slice.items, i)}
          isThreadChild={isThreadChildAt(slice.items, i)}
          isThreadLastChild={
            isThreadChildAt(slice.items, i) && slice.items.length === i + 1
          }
          isParentBlocked={slice.items[i].isParentBlocked}
          isParentNotFound={slice.items[i].isParentNotFound}
          hideTopBorder={hideTopBorder && i === 0}
          rootPost={slice.items[0].post}
        />
      ))}
    </>
  )
}
FeedSlice = memo(FeedSlice)
export {FeedSlice}

function ViewFullThread({uri}: {uri: string}) {
  const {
    state: hover,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const pal = usePalette('default')
  const itemHref = React.useMemo(() => {
    const urip = new AtUri(uri)
    return makeProfileLink({did: urip.hostname, handle: ''}, 'post', urip.rkey)
  }, [uri])

  return (
    <Link
      style={[styles.viewFullThread]}
      href={itemHref}
      asAnchor
      noFeedback
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}>
      <SubtleWebHover
        hover={hover}
        // adjust position for visual alignment - the actual box has lots of top padding and not much bottom padding -sfn
        style={{top: 8, bottom: -5}}
      />
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
    width: 42,
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
