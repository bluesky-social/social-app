import {View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {makeCustomFeedLink} from '#/lib/routes/links'
import {atoms as a, useTheme} from '#/alf'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  NotificationActivitySmall_Filled_Corner0_Rounded as ActivityIcon,
  NotificationLikeSmall_Filled_Corner0_Rounded as HeartIcon,
  NotificationRepostSmall_Filled_Corner0_Rounded as RepostIcon,
} from '#/components/icons/Notification'
import * as Item from '../Item'
import {makeActivityListLink, makePostLink} from '../links'
import {type NotificationOf} from '../types'

/**
 * Shared anatomy for likes and reposts of one post: the headline actor's
 * avatar, the other actors, the primary sentence, a preview of the post, and
 * the post's images on the trailing edge. Pressing the row opens the post,
 * and a group expands to list everyone in it.
 */
function PostReactionRow({
  notification,
  icon,
  tone,
  label,
  children,
}: {
  notification: NotificationOf<
    'like' | 'repost' | 'likeViaRepost' | 'repostViaRepost'
  >
  icon: React.ComponentType<SVGIconProps>
  tone: Item.BadgeTone
  /**
   * Plain-text version of the primary sentence, for screen readers.
   */
  label: string
  /**
   * The primary sentence, as an `Item.PrimaryText`.
   */
  children: React.ReactNode
}) {
  const {post, actors} = notification
  const hasThumbnails = Item.getPostThumbnails(post.embed).length > 0
  const mediaBlurred = Item.usePostMediaBlurred(post)

  return (
    <Item.GroupRoot
      notification={notification}
      href={makePostLink(post)}
      label={label}
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={actors[0]} icon={icon} tone={tone} />
      <Item.Content>
        <Item.AvatarRow />
        {children}
        <Item.PostPreview post={post} />
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
      {hasThumbnails && (
        <Item.Trailing>
          <Item.InlineImages
            embed={post.embed}
            size={60}
            blurred={mediaBlurred}
          />
        </Item.Trailing>
      )}
    </Item.GroupRoot>
  )
}

/**
 * Someone, or a group of people, liked one of the viewer's posts.
 */
export function LikeNotification({
  notification,
}: {
  notification: NotificationOf<'like'>
}) {
  const {t: l} = useLingui()
  const {actor, name, second, secondName, others} =
    Item.useGroupNames(notification)

  return (
    <PostReactionRow
      notification={notification}
      icon={HeartIcon}
      tone="like"
      label={
        second
          ? l`${name} and ${secondName} liked your post`
          : others > 0
            ? l`${name} and ${plural(others, {
                one: '# other',
                other: '# others',
              })} liked your post`
            : l`${name} liked your post`
      }>
      <Item.PrimaryText>
        {second ? (
          <Trans>
            <Item.Name profile={actor} /> and <Item.Name profile={second} />{' '}
            liked your post
          </Trans>
        ) : others > 0 ? (
          <Trans>
            <Item.Name profile={actor} /> and{' '}
            <Item.Strong>
              <Plural value={others} one="# other" other="# others" />
            </Item.Strong>{' '}
            liked your post
          </Trans>
        ) : (
          <Trans>
            <Item.Name profile={actor} /> liked your post
          </Trans>
        )}
      </Item.PrimaryText>
    </PostReactionRow>
  )
}

/**
 * Someone, or a group of people, reposted one of the viewer's posts.
 */
export function RepostNotification({
  notification,
}: {
  notification: NotificationOf<'repost'>
}) {
  const {t: l} = useLingui()
  const {actor, name, second, secondName, others} =
    Item.useGroupNames(notification)

  return (
    <PostReactionRow
      notification={notification}
      icon={RepostIcon}
      tone="repost"
      label={
        second
          ? l`${name} and ${secondName} reposted your post`
          : others > 0
            ? l`${name} and ${plural(others, {
                one: '# other',
                other: '# others',
              })} reposted your post`
            : l`${name} reposted your post`
      }>
      <Item.PrimaryText>
        {second ? (
          <Trans>
            <Item.Name profile={actor} /> and <Item.Name profile={second} />{' '}
            reposted your post
          </Trans>
        ) : others > 0 ? (
          <Trans>
            <Item.Name profile={actor} /> and{' '}
            <Item.Strong>
              <Plural value={others} one="# other" other="# others" />
            </Item.Strong>{' '}
            reposted your post
          </Trans>
        ) : (
          <Trans>
            <Item.Name profile={actor} /> reposted your post
          </Trans>
        )}
      </Item.PrimaryText>
    </PostReactionRow>
  )
}

/**
 * Someone, or a group of people, liked a post via the viewer's repost of it.
 * The row previews and opens the original post.
 */
export function LikeViaRepostNotification({
  notification,
}: {
  notification: NotificationOf<'likeViaRepost'>
}) {
  const {t: l} = useLingui()
  const {actor, name, second, secondName, others} =
    Item.useGroupNames(notification)

  return (
    <PostReactionRow
      notification={notification}
      icon={HeartIcon}
      tone="like"
      label={
        second
          ? l`${name} and ${secondName} liked your repost`
          : others > 0
            ? l`${name} and ${plural(others, {
                one: '# other',
                other: '# others',
              })} liked your repost`
            : l`${name} liked your repost`
      }>
      <Item.PrimaryText>
        {second ? (
          <Trans>
            <Item.Name profile={actor} /> and <Item.Name profile={second} />{' '}
            liked your repost
          </Trans>
        ) : others > 0 ? (
          <Trans>
            <Item.Name profile={actor} /> and{' '}
            <Item.Strong>
              <Plural value={others} one="# other" other="# others" />
            </Item.Strong>{' '}
            liked your repost
          </Trans>
        ) : (
          <Trans>
            <Item.Name profile={actor} /> liked your repost
          </Trans>
        )}
      </Item.PrimaryText>
    </PostReactionRow>
  )
}

/**
 * Someone, or a group of people, reposted a post via the viewer's repost of
 * it. The row previews and opens the original post.
 */
export function RepostViaRepostNotification({
  notification,
}: {
  notification: NotificationOf<'repostViaRepost'>
}) {
  const {t: l} = useLingui()
  const {actor, name, second, secondName, others} =
    Item.useGroupNames(notification)

  return (
    <PostReactionRow
      notification={notification}
      icon={RepostIcon}
      tone="repost"
      label={
        second
          ? l`${name} and ${secondName} reposted your repost`
          : others > 0
            ? l`${name} and ${plural(others, {
                one: '# other',
                other: '# others',
              })} reposted your repost`
            : l`${name} reposted your repost`
      }>
      <Item.PrimaryText>
        {second ? (
          <Trans>
            <Item.Name profile={actor} /> and <Item.Name profile={second} />{' '}
            reposted your repost
          </Trans>
        ) : others > 0 ? (
          <Trans>
            <Item.Name profile={actor} /> and{' '}
            <Item.Strong>
              <Plural value={others} one="# other" other="# others" />
            </Item.Strong>{' '}
            reposted your repost
          </Trans>
        ) : (
          <Trans>
            <Item.Name profile={actor} /> reposted your repost
          </Trans>
        )}
      </Item.PrimaryText>
    </PostReactionRow>
  )
}

/**
 * Shared anatomy for one person liking or reposting several posts: their
 * avatar, the primary sentence, a preview of the newest post, and a "View
 * all" link. The row and the link open the activity list with every post.
 */
function MultiPostRow({
  notification,
  icon,
  tone,
  label,
  viewAllLabel,
  children,
}: {
  notification: NotificationOf<
    | 'multiPostLike'
    | 'multiPostRepost'
    | 'multiPostLikeViaRepost'
    | 'multiPostRepostViaRepost'
  >
  icon: React.ComponentType<SVGIconProps>
  tone: Item.BadgeTone
  /**
   * Plain-text version of the primary sentence, for screen readers.
   */
  label: string
  /**
   * Accessibility label for "View all", saying what "all" is.
   */
  viewAllLabel: string
  /**
   * The primary sentence, as an `Item.PrimaryText`.
   */
  children: React.ReactNode
}) {
  const t = useTheme()
  const {actor, posts} = notification
  const [post] = posts
  const href = makeActivityListLink(posts.map(p => p.uri))
  const hasThumbnails = Item.getPostThumbnails(post.embed).length > 0
  const mediaBlurred = Item.usePostMediaBlurred(post)

  return (
    <Item.Root
      href={href}
      isRead={notification.isRead}
      label={label}
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={actor} icon={icon} tone={tone} />
      <Item.Content>
        {children}
        <Item.PostPreview post={post} style={t.atoms.text_contrast_high} />
        <Item.Timestamp date={notification.indexedAt} />
        <Item.ViewAllLink href={href} label={viewAllLabel} />
      </Item.Content>
      {hasThumbnails && (
        <Item.Trailing>
          <Item.InlineImages
            embed={post.embed}
            size={60}
            blurred={mediaBlurred}
          />
        </Item.Trailing>
      )}
    </Item.Root>
  )
}

/**
 * One person liked several of the viewer's posts.
 */
export function MultiPostLikeNotification({
  notification,
}: {
  notification: NotificationOf<'multiPostLike'>
}) {
  const {t: l} = useLingui()
  const {actor, count} = notification
  const name = Item.useDisplayName(actor)

  return (
    <MultiPostRow
      notification={notification}
      icon={HeartIcon}
      tone="like"
      label={l`${name} liked ${count} of your ${plural(count, {
        one: 'post',
        other: 'posts',
      })}`}
      viewAllLabel={l`View all posts ${name} liked`}>
      <Item.PrimaryText>
        <Trans>
          <Item.Name profile={actor} /> liked {count} of your{' '}
          <Plural value={count} one="post" other="posts" />
        </Trans>
      </Item.PrimaryText>
    </MultiPostRow>
  )
}

/**
 * One person reposted several of the viewer's posts.
 */
export function MultiPostRepostNotification({
  notification,
}: {
  notification: NotificationOf<'multiPostRepost'>
}) {
  const {t: l} = useLingui()
  const {actor, count} = notification
  const name = Item.useDisplayName(actor)

  return (
    <MultiPostRow
      notification={notification}
      icon={RepostIcon}
      tone="repost"
      label={l`${name} reposted ${count} of your ${plural(count, {
        one: 'post',
        other: 'posts',
      })}`}
      viewAllLabel={l`View all posts ${name} reposted`}>
      <Item.PrimaryText>
        <Trans>
          <Item.Name profile={actor} /> reposted {count} of your{' '}
          <Plural value={count} one="post" other="posts" />
        </Trans>
      </Item.PrimaryText>
    </MultiPostRow>
  )
}

/**
 * One person liked several posts via the viewer's reposts of them. The row
 * previews and lists the original posts.
 */
export function MultiPostLikeViaRepostNotification({
  notification,
}: {
  notification: NotificationOf<'multiPostLikeViaRepost'>
}) {
  const {t: l} = useLingui()
  const {actor, count} = notification
  const name = Item.useDisplayName(actor)

  return (
    <MultiPostRow
      notification={notification}
      icon={HeartIcon}
      tone="like"
      label={l`${name} liked ${count} of your ${plural(count, {
        one: 'repost',
        other: 'reposts',
      })}`}
      viewAllLabel={l`View all reposts ${name} liked`}>
      <Item.PrimaryText>
        <Trans>
          <Item.Name profile={actor} /> liked {count} of your{' '}
          <Plural value={count} one="repost" other="reposts" />
        </Trans>
      </Item.PrimaryText>
    </MultiPostRow>
  )
}

/**
 * One person reposted several posts via the viewer's reposts of them. The
 * row previews and lists the original posts.
 */
export function MultiPostRepostViaRepostNotification({
  notification,
}: {
  notification: NotificationOf<'multiPostRepostViaRepost'>
}) {
  const {t: l} = useLingui()
  const {actor, count} = notification
  const name = Item.useDisplayName(actor)

  return (
    <MultiPostRow
      notification={notification}
      icon={RepostIcon}
      tone="repost"
      label={l`${name} reposted ${count} of your ${plural(count, {
        one: 'repost',
        other: 'reposts',
      })}`}
      viewAllLabel={l`View all reposts ${name} reposted`}>
      <Item.PrimaryText>
        <Trans>
          <Item.Name profile={actor} /> reposted {count} of your{' '}
          <Plural value={count} one="repost" other="reposts" />
        </Trans>
      </Item.PrimaryText>
    </MultiPostRow>
  )
}

/**
 * Someone, or a group of people, liked one of the viewer's custom feeds.
 * Pressing the row opens the feed, and a group expands to list everyone in
 * it.
 */
export function GeneratorLikeNotification({
  notification,
}: {
  notification: NotificationOf<'generatorLike'>
}) {
  const {t: l} = useLingui()
  const {generator} = notification
  const {actor, name, second, secondName, others} =
    Item.useGroupNames(notification)
  const feedUri = new AtUri(generator.uri)

  return (
    <Item.GroupRoot
      notification={notification}
      href={makeCustomFeedLink(feedUri.host, feedUri.rkey)}
      label={
        second
          ? l`${name} and ${secondName} liked your custom feed`
          : others > 0
            ? l`${name} and ${plural(others, {
                one: '# other',
                other: '# others',
              })} liked your custom feed`
            : l`${name} liked your custom feed`
      }
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={actor} icon={HeartIcon} tone="like" />
      <Item.Content style={a.gap_sm}>
        <View style={[a.gap_xs]}>
          <Item.AvatarRow />
          <Item.PrimaryText>
            {second ? (
              <Trans>
                <Item.Name profile={actor} /> and <Item.Name profile={second} />{' '}
                liked your custom feed
              </Trans>
            ) : others > 0 ? (
              <Trans>
                <Item.Name profile={actor} /> and{' '}
                <Item.Strong>
                  <Plural value={others} one="# other" other="# others" />
                </Item.Strong>{' '}
                liked your custom feed
              </Trans>
            ) : (
              <Trans>
                <Item.Name profile={actor} /> liked your custom feed
              </Trans>
            )}
          </Item.PrimaryText>
        </View>
        <Item.FeedCard generator={generator} />
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
    </Item.GroupRoot>
  )
}

/**
 * New posts from accounts the viewer has subscribed to. A single post opens
 * that post, otherwise the row opens the activity list with all of them.
 * Posts from several authors expand to list the authors.
 */
export function SubscribedPostNotification({
  notification,
}: {
  notification: NotificationOf<'subscribedPost'>
}) {
  const {t: l} = useLingui()
  const {items, count} = notification
  // Items are newest first, so this is the post to preview
  const [{post, parent}] = items
  // Set when the group is a lone post that replies to another
  const replyParent = count === 1 ? parent : undefined
  const {actor, name, second, secondName, others} =
    Item.useGroupNames(notification)
  const hasThumbnails = Item.getPostThumbnails(post.embed).length > 0
  const mediaBlurred = Item.usePostMediaBlurred(post)

  return (
    <Item.GroupRoot
      notification={notification}
      href={
        items.length === 1
          ? makePostLink(post)
          : makeActivityListLink(items.map(item => item.post.uri))
      }
      label={
        second
          ? l`New posts from ${name} and ${secondName}`
          : others > 0
            ? l`New posts from ${name} and ${plural(others, {
                one: '# other',
                other: '# others',
              })}`
            : replyParent
              ? l`New reply from ${name}`
              : l`New ${plural(count, {one: 'post', other: 'posts'})} from ${name}`
      }
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={actor} icon={ActivityIcon} tone="activity" />
      <Item.Content>
        <Item.AvatarRow />
        <Item.PrimaryText>
          {second ? (
            <Trans>
              New posts from <Item.Name profile={actor} /> and{' '}
              <Item.Name profile={second} />
            </Trans>
          ) : others > 0 ? (
            <Trans>
              New posts from <Item.Name profile={actor} /> and{' '}
              <Item.Strong>
                <Plural value={others} one="# other" other="# others" />
              </Item.Strong>
            </Trans>
          ) : replyParent ? (
            <Trans>
              New reply from <Item.Name profile={actor} />
            </Trans>
          ) : (
            <Trans>
              New <Plural value={count} one="post" other="posts" /> from{' '}
              <Item.Name profile={actor} />
            </Trans>
          )}
        </Item.PrimaryText>
        {replyParent && <Item.ReplyContext parent={replyParent} />}
        <Item.PostPreview post={post} />
        <Item.Timestamp date={notification.indexedAt} />
      </Item.Content>
      {hasThumbnails && (
        <Item.Trailing>
          <Item.InlineImages
            embed={post.embed}
            size={60}
            blurred={mediaBlurred}
          />
        </Item.Trailing>
      )}
    </Item.GroupRoot>
  )
}
