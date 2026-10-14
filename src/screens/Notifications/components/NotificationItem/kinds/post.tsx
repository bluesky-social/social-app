import {View} from 'react-native'

import {POST_TOMBSTONE, usePostShadow} from '#/state/cache/post-shadow'
import {type ParentPost} from '#/state/queries/notifications/grouped/types'
import {atoms as a} from '#/alf'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  NotificationActivitySmall_Filled_Corner0_Rounded as ActivityIcon,
  NotificationMentionSmall_Filled_Corner0_Rounded as MentionIcon,
  NotificationQuoteSmall_Filled_Corner0_Rounded as QuoteIcon,
  NotificationReplySmall_Filled_Corner0_Rounded as ReplyIcon,
} from '#/components/icons/Notification'
import {type app} from '#/lexicons'
import * as Item from '../Item'
import {makePostLink} from '../links'
import {type NotificationOf} from '../types'

type PostView = app.bsky.feed.defs.PostView

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
      post={notification.post}
      icon={ReplyIcon}
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
      post={notification.post}
      icon={QuoteIcon}
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
      post={notification.post}
      icon={MentionIcon}
      parent={notification.parent}
      replyVariant="inReply"
    />
  )
}

/**
 * A new post from an account the viewer has subscribed to, which replies to
 * another post. It shows as a reply rather than as a new post, with the
 * activity badge.
 */
export function SubscribedReplyNotification({
  notification,
  post,
  parent,
}: {
  notification: NotificationOf<'subscribedPost'>
  post: PostView
  parent: ParentPost
}) {
  return (
    <PostNotification
      notification={notification}
      post={post}
      icon={ActivityIcon}
      tone="activity"
      parent={parent}
      replyVariant="reply"
    />
  )
}

/**
 * Shared layout for notifications about a single post by someone else: the
 * author, what it replies to, the post itself, and actions to respond.
 */
function PostNotification({
  notification,
  post,
  icon,
  tone = 'conversation',
  parent,
  replyVariant,
}: {
  notification: NotificationOf<'reply' | 'quote' | 'mention' | 'subscribedPost'>
  post: PostView
  icon: React.ComponentType<SVGIconProps>
  tone?: Item.BadgeTone
  parent?: ParentPost
  replyVariant: 'reply' | 'inReply'
}) {
  const shadow = usePostShadow(post)

  if (shadow === POST_TOMBSTONE) return null

  return (
    <Item.Root
      href={makePostLink(post)}
      isRead={notification.isRead}
      // Actions in the row need to be individually reachable
      accessible={false}
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={post.author} icon={icon} tone={tone} />
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
