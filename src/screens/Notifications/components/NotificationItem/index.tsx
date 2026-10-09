import {type NotificationView} from '#/state/queries/notifications/grouped/types'
import {
  GeneratorLikeNotification,
  LikeNotification,
  LikeViaRepostNotification,
  MultiPostLikeNotification,
  RepostNotification,
  RepostViaRepostNotification,
  SubscribedPostNotification,
} from './kinds/aggregate'
import {
  MentionNotification,
  QuoteNotification,
  ReplyNotification,
} from './kinds/post'
import {
  ContactMatchNotification,
  FollowBackNotification,
  FollowNotification,
  StarterPackJoinedNotification,
  UnverifiedNotification,
  VerifiedNotification,
} from './kinds/profile'

/**
 * Renders one grouped notification, picking the row for its kind. Each kind
 * composes its row from the `Item.*` parts in `./Item`.
 */
export function NotificationItem({
  notification,
}: {
  notification: NotificationView
}) {
  switch (notification.type) {
    case 'like':
      return <LikeNotification notification={notification} />
    case 'multiPostLike':
      return <MultiPostLikeNotification notification={notification} />
    case 'repost':
      return <RepostNotification notification={notification} />
    case 'likeViaRepost':
      return <LikeViaRepostNotification notification={notification} />
    case 'repostViaRepost':
      return <RepostViaRepostNotification notification={notification} />
    case 'generatorLike':
      return <GeneratorLikeNotification notification={notification} />
    case 'subscribedPost':
      return <SubscribedPostNotification notification={notification} />
    case 'reply':
      return <ReplyNotification notification={notification} />
    case 'quote':
      return <QuoteNotification notification={notification} />
    case 'mention':
      return <MentionNotification notification={notification} />
    case 'follow':
      return <FollowNotification notification={notification} />
    case 'followBack':
      return <FollowBackNotification notification={notification} />
    case 'verified':
      return <VerifiedNotification notification={notification} />
    case 'unverified':
      return <UnverifiedNotification notification={notification} />
    case 'starterPackJoined':
      return <StarterPackJoinedNotification notification={notification} />
    case 'contactMatch':
      return <ContactMatchNotification notification={notification} />
    default:
      notification satisfies never
      return null
  }
}
