import {View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {makeCustomFeedLink} from '#/lib/routes/links'
import {atoms as a, useTheme} from '#/alf'
import {BellPlus_Stroke2_Corner0_Rounded as BellPlusIcon} from '#/components/icons/Bell'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {LikeRepost_Stroke2_Corner2_Rounded as LikeRepostIcon} from '#/components/icons/LikeRepost'
import {
  Repost_Stroke2_Corner3_Rounded as RepostIcon,
  RepostRepost_Stroke2_Corner2_Rounded as RepostRepostIcon,
} from '#/components/icons/Repost'
import * as Item from '../Item'
import {makeActivityListLink, makePostLink} from '../links'
import {type NotificationOf} from '../types'

/**
 * Shared anatomy for likes and reposts of one post: the headline actor's
 * avatar, the other actors, the primary sentence, a preview of the post, and
 * the post's images on the trailing edge. Pressing the row opens the post.
 */
function PostReactionRow({
  notification,
  icon,
  tone,
  label,
  othersHref,
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
   * Where the "+N" chip in the avatar row goes, if anywhere.
   */
  othersHref?: string
  /**
   * The primary sentence, as an `Item.PrimaryText`.
   */
  children: React.ReactNode
}) {
  const {post, actors} = notification
  const hasThumbnails = Item.getPostThumbnails(post.embed).length > 0
  const mediaBlurred = Item.usePostMediaBlurred(post)

  return (
    <Item.Root
      href={makePostLink(post)}
      isRead={notification.isRead}
      label={label}
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={actors[0]} icon={icon} tone={tone} />
      <Item.Content>
        {notification.count > 1 && (
          <Item.AvatarRow
            profiles={actors.slice(1)}
            total={notification.count - 1}
            href={othersHref}
          />
        )}
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
    </Item.Root>
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
  const actor = notification.actors[0]
  const name = Item.useDisplayName(actor)
  const others = notification.count - 1

  return (
    <PostReactionRow
      notification={notification}
      icon={HeartIcon}
      tone="like"
      othersHref={makePostLink(notification.post, 'liked-by')}
      label={
        others > 0
          ? l`${name} and ${plural(others, {
              one: '# other',
              other: '# others',
            })} liked your post`
          : l`${name} liked your post`
      }>
      <Item.PrimaryText>
        {others > 0 ? (
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
  const actor = notification.actors[0]
  const name = Item.useDisplayName(actor)
  const others = notification.count - 1

  return (
    <PostReactionRow
      notification={notification}
      icon={RepostIcon}
      tone="repost"
      othersHref={makePostLink(notification.post, 'reposted-by')}
      label={
        others > 0
          ? l`${name} and ${plural(others, {
              one: '# other',
              other: '# others',
            })} reposted your post`
          : l`${name} reposted your post`
      }>
      <Item.PrimaryText>
        {others > 0 ? (
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
  const actor = notification.actors[0]
  const name = Item.useDisplayName(actor)
  const others = notification.count - 1

  /*
   * The post's liked-by list also has likes that didn't come via the
   * viewer's repost, but it's the closest list there is, and a "+N" that goes
   * nowhere looks broken.
   */
  return (
    <PostReactionRow
      notification={notification}
      icon={LikeRepostIcon}
      tone="like"
      othersHref={makePostLink(notification.post, 'liked-by')}
      label={
        others > 0
          ? l`${name} and ${plural(others, {
              one: '# other',
              other: '# others',
            })} liked your repost`
          : l`${name} liked your repost`
      }>
      <Item.PrimaryText>
        {others > 0 ? (
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
  const actor = notification.actors[0]
  const name = Item.useDisplayName(actor)
  const others = notification.count - 1

  // A superset of these people, as in `LikeViaRepostNotification`
  return (
    <PostReactionRow
      notification={notification}
      icon={RepostRepostIcon}
      tone="repost"
      othersHref={makePostLink(notification.post, 'reposted-by')}
      label={
        others > 0
          ? l`${name} and ${plural(others, {
              one: '# other',
              other: '# others',
            })} reposted your repost`
          : l`${name} reposted your repost`
      }>
      <Item.PrimaryText>
        {others > 0 ? (
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
 * One person liked several of the viewer's posts. The row and "View all" open
 * the activity list with every liked post.
 */
export function MultiPostLikeNotification({
  notification,
}: {
  notification: NotificationOf<'multiPostLike'>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {actor, posts, count} = notification
  const [post] = posts
  const name = Item.useDisplayName(actor)
  const href = makeActivityListLink(posts.map(p => p.uri))
  const hasThumbnails = Item.getPostThumbnails(post.embed).length > 0
  const mediaBlurred = Item.usePostMediaBlurred(post)

  return (
    <Item.Root
      href={href}
      isRead={notification.isRead}
      label={l`${name} liked ${count} of your ${plural(count, {
        one: 'post',
        other: 'posts',
      })}`}
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={actor} icon={HeartIcon} tone="like" />
      <Item.Content>
        <Item.PrimaryText>
          <Trans>
            <Item.Name profile={actor} /> liked {count} of your{' '}
            <Plural value={count} one="post" other="posts" />
          </Trans>
        </Item.PrimaryText>
        <Item.PostPreview post={post} style={t.atoms.text_contrast_high} />
        <Item.Timestamp date={notification.indexedAt} />
        <Item.ViewAllLink href={href} label={l`View all posts ${name} liked`} />
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
 * Someone, or a group of people, liked one of the viewer's custom feeds.
 */
export function GeneratorLikeNotification({
  notification,
}: {
  notification: NotificationOf<'generatorLike'>
}) {
  const {t: l} = useLingui()
  const {generator, actors} = notification
  const actor = actors[0]
  const name = Item.useDisplayName(actor)
  const others = notification.count - 1
  const feedUri = new AtUri(generator.uri)

  return (
    <Item.Root
      href={makeCustomFeedLink(feedUri.host, feedUri.rkey)}
      isRead={notification.isRead}
      label={
        others > 0
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
          {others > 0 && (
            <Item.AvatarRow
              profiles={actors.slice(1)}
              total={others}
              href={makeCustomFeedLink(feedUri.host, feedUri.rkey, 'liked-by')}
            />
          )}
          <Item.PrimaryText>
            {others > 0 ? (
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
    </Item.Root>
  )
}

/**
 * New posts from accounts the viewer has subscribed to. A single post opens
 * that post, otherwise the row opens the activity list with all of them.
 */
export function SubscribedPostNotification({
  notification,
}: {
  notification: NotificationOf<'subscribedPost'>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {items, count} = notification
  // Items are newest first, so this is the post to preview
  const [{actor, post}] = items
  const name = Item.useDisplayName(actor)
  const authors = items
    .map(item => item.actor)
    .filter(
      (author, index, all) =>
        all.findIndex(other => other.did === author.did) === index,
    )
  const others = authors.length - 1
  const hasThumbnails = Item.getPostThumbnails(post.embed).length > 0
  const mediaBlurred = Item.usePostMediaBlurred(post)

  return (
    <Item.Root
      href={
        items.length === 1
          ? makePostLink(post)
          : makeActivityListLink(items.map(item => item.post.uri))
      }
      isRead={notification.isRead}
      label={
        others > 0
          ? l`New posts from ${name} and ${plural(others, {
              one: '# other',
              other: '# others',
            })}`
          : l`New ${plural(count, {one: 'post', other: 'posts'})} from ${name}`
      }
      testID={`notification-${notification.type}-${notification.id}`}>
      <Item.Avatar profile={actor} icon={BellPlusIcon} tone="activity" />
      <Item.Content>
        {others > 0 && (
          <Item.AvatarRow profiles={authors.slice(1)} total={others} />
        )}
        <Item.PrimaryText>
          {others > 0 ? (
            <Trans>
              New posts from <Item.Name profile={actor} /> and{' '}
              <Item.Strong>
                <Plural value={others} one="# other" other="# others" />
              </Item.Strong>
            </Trans>
          ) : (
            <Trans>
              New <Plural value={count} one="post" other="posts" /> from{' '}
              <Item.Name profile={actor} />
            </Trans>
          )}
        </Item.PrimaryText>
        <Item.PostPreview post={post} style={t.atoms.text} />
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
    </Item.Root>
  )
}
