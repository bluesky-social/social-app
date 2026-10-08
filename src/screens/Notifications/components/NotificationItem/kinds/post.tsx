import {View} from 'react-native'

import {POST_TOMBSTONE, usePostShadow} from '#/state/cache/post-shadow'
import {type ParentPost} from '#/state/queries/notifications/grouped/types'
import {atoms as a} from '#/alf'
import {ArrowCornerDownRight_Stroke2_Corner2_Rounded as ArrowCornerDownRight} from '#/components/icons/Arrow'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {CloseQuote_Filled_Stroke2_Corner0_Rounded as CloseQuote} from '#/components/icons/CloseQuote'
import {type Props as SVGIconProps} from '#/components/icons/common'
import * as Item from '../Item'
import {makePostLink} from '../links'
import {type NotificationOf} from '../types'

/**
 * Someone replied to the viewer's post, or to a post in a thread they're in.
 */
export function ReplyNotification({
  notification,
}: {
  notification: NotificationOf<'reply'>
}) {
  return (
    <PostNotification
      notification={notification}
      icon={ArrowCornerDownRight}
      parent={notification.parent}
      replyVariant="reply"
    />
  )
}

/**
 * Someone quoted one of the viewer's posts. The quoted post shows as a card
 * under the quoting post's text.
 */
export function QuoteNotification({
  notification,
}: {
  notification: NotificationOf<'quote'>
}) {
  return (
    <PostNotification
      notification={notification}
      icon={CloseQuote}
      parent={notification.parent}
      replyVariant="inReply"
    />
  )
}

/**
 * Someone mentioned the viewer in a post.
 */
export function MentionNotification({
  notification,
}: {
  notification: NotificationOf<'mention'>
}) {
  return (
    <PostNotification
      notification={notification}
      icon={At}
      parent={notification.parent}
      replyVariant="inReply"
    />
  )
}

/**
 * Shared layout for notifications about a single post by someone else: the
 * author, what it replies to, the post itself, and actions to respond.
 */
function PostNotification({
  notification,
  icon,
  parent,
  replyVariant,
}: {
  notification: NotificationOf<'reply' | 'quote' | 'mention'>
  icon: React.ComponentType<SVGIconProps>
  parent?: ParentPost
  replyVariant: 'reply' | 'inReply'
}) {
  const {post} = notification
  const shadow = usePostShadow(post)

  if (shadow === POST_TOMBSTONE) return null

  return (
    <Item.Root
      href={makePostLink(post)}
      isRead={notification.isRead}
      // Actions in the row need to be individually reachable
      accessible={false}
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={post.author} icon={icon} tone="conversation" />
      <Item.Content style={[a.gap_sm]}>
        <View style={[a.gap_xs]}>
          <Item.Author profile={post.author} />
          {parent && (
            <Item.ReplyContext parent={parent} variant={replyVariant} />
          )}
          <Item.PostBody post={post} />
          <Item.Timestamp date={notification.indexedAt} />
        </View>
        <Item.PostActions post={post} />
      </Item.Content>
    </Item.Root>
  )
}
