import React, {useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import {AtUri} from '../../../third-party/uri'
import {FontAwesomeIcon, Props} from '@fortawesome/react-native-fontawesome'
import {NotificationsViewItemModel} from '../../../state/models/notifications-view'
import {PostThreadViewModel} from '../../../state/models/post-thread-view'
import {s, colors} from '../../lib/styles'
import {ago, pluralize} from '../../../lib/strings'
import {UpIconSolid} from '../../lib/icons'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Post} from '../post/Post'
import {Link} from '../util/Link'
import {InviteAccepter} from './InviteAccepter'

const MAX_AUTHORS = 8

export const FeedItem = observer(function FeedItem({
  item,
}: {
  item: NotificationsViewItemModel
}) {
  const itemHref = useMemo(() => {
    if (item.isUpvote || item.isRepost || item.isTrend) {
      const urip = new AtUri(item.subjectUri)
      return `/profile/${urip.host}/post/${urip.rkey}`
    } else if (item.isFollow || item.isAssertion) {
      return `/profile/${item.author.handle}`
    } else if (item.isReply) {
      const urip = new AtUri(item.uri)
      return `/profile/${urip.host}/post/${urip.rkey}`
    }
    return ''
  }, [item])
  const itemTitle = useMemo(() => {
    if (item.isUpvote || item.isRepost) {
      return 'Post'
    } else if (item.isFollow || item.isAssertion) {
      return item.author.handle
    } else if (item.isReply) {
      return 'Post'
    }
  }, [item])

  if (item.additionalPost?.notFound) {
    // don't render anything if the target post was deleted or unfindable
    return <View />
  }

  if (item.isReply || item.isMention) {
    return (
      <Link href={itemHref} title={itemTitle} noFeedback>
        <Post
          uri={item.uri}
          initView={item.additionalPost}
          style={[item.isRead ? undefined : styles.outerUnread]}
        />
      </Link>
    )
  }

  let action = ''
  let icon: Props['icon'] | 'UpIconSolid'
  let iconStyle: Props['style'] = []
  if (item.isUpvote) {
    action = 'upvoted your post'
    icon = 'UpIconSolid'
    iconStyle = [s.red3, {position: 'relative', top: -4}]
  } else if (item.isRepost) {
    action = 'reposted your post'
    icon = 'retweet'
    iconStyle = [s.green3]
  } else if (item.isTrend) {
    action = 'Your post is trending with'
    icon = 'arrow-trend-up'
    iconStyle = [s.red3]
  } else if (item.isReply) {
    action = 'replied to your post'
    icon = ['far', 'comment']
  } else if (item.isFollow) {
    action = 'followed you'
    icon = 'user-plus'
    iconStyle = [s.blue3]
  } else if (item.isInvite) {
    icon = 'users'
    iconStyle = [s.blue3]
    action = 'invited you to join their scene'
  } else {
    return <></>
  }

  let authors: {
    href: string
    handle: string
    displayName?: string
    avatar?: string
  }[] = [
    {
      href: `/profile/${item.author.handle}`,
      handle: item.author.handle,
      displayName: item.author.displayName,
      avatar: item.author.avatar,
    },
  ]
  if (item.additional?.length) {
    authors = authors.concat(
      item.additional.map(item2 => ({
        href: `/profile/${item2.author.handle}`,
        handle: item2.author.handle,
        displayName: item2.author.displayName,
        avatar: item2.author.avatar,
      })),
    )
  }

  return (
    <Link
      style={[styles.outer, item.isRead ? undefined : styles.outerUnread]}
      href={itemHref}
      title={itemTitle}
      noFeedback>
      <View style={styles.layout}>
        <View style={styles.layoutIcon}>
          {icon === 'UpIconSolid' ? (
            <UpIconSolid size={26} style={[styles.icon, ...iconStyle]} />
          ) : (
            <FontAwesomeIcon
              icon={icon}
              size={22}
              style={[styles.icon, ...iconStyle]}
            />
          )}
        </View>
        <View style={styles.layoutContent}>
          <View style={styles.avis}>
            {authors.slice(0, MAX_AUTHORS).map(author => (
              <Link
                style={{marginRight: 3}}
                key={author.href}
                href={author.href}
                title={`@${author.handle}`}>
                <UserAvatar
                  size={30}
                  displayName={author.displayName}
                  handle={author.handle}
                  avatar={author.avatar}
                />
              </Link>
            ))}
            {authors.length > MAX_AUTHORS ? (
              <Text style={styles.aviExtraCount}>
                +{authors.length - MAX_AUTHORS}
              </Text>
            ) : undefined}
          </View>
          <View style={styles.meta}>
            {item.isTrend && (
              <Text style={[styles.metaItem, s.f15]}>{action}</Text>
            )}
            <Link
              key={authors[0].href}
              style={styles.metaItem}
              href={authors[0].href}
              title={`@${authors[0].handle}`}>
              <Text style={[s.f15, s.bold, s.black]}>
                {authors[0].displayName || authors[0].handle}
              </Text>
            </Link>
            {authors.length > 1 ? (
              <>
                <Text style={[styles.metaItem, s.f15]}>and</Text>
                <Text style={[styles.metaItem, s.f15, s.bold]}>
                  {authors.length - 1} {pluralize(authors.length - 1, 'other')}
                </Text>
              </>
            ) : undefined}
            {!item.isTrend && (
              <Text style={[styles.metaItem, s.f15]}>{action}</Text>
            )}
            <Text style={[styles.metaItem, s.f15, s.gray5]}>
              {ago(item.indexedAt)}
            </Text>
          </View>
          {item.isUpvote || item.isRepost || item.isTrend ? (
            <AdditionalPostText additionalPost={item.additionalPost} />
          ) : (
            <></>
          )}
        </View>
      </View>
      {item.isInvite && (
        <View style={styles.addedContainer}>
          <InviteAccepter item={item} />
        </View>
      )}
    </Link>
  )
})

function AdditionalPostText({
  additionalPost,
}: {
  additionalPost?: PostThreadViewModel
}) {
  if (!additionalPost) {
    return <View />
  }
  if (additionalPost.error) {
    return <ErrorMessage message={additionalPost.error} />
  }
  return (
    <Text style={[s.gray5]}>{additionalPost.thread?.post.record.text}</Text>
  )
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.white,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
  },
  outerUnread: {
    backgroundColor: colors.unreadNotifBg,
    borderWidth: 1,
    borderColor: colors.blue1,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutIcon: {
    width: 35,
    alignItems: 'flex-end',
  },
  icon: {
    marginRight: 10,
    marginTop: 4,
  },
  avis: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aviExtraCount: {
    fontWeight: 'bold',
    paddingLeft: 6,
    color: colors.gray5,
  },
  layoutContent: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 6,
    paddingBottom: 2,
  },
  metaItem: {
    paddingRight: 3,
    color: colors.black,
  },
  postText: {
    paddingBottom: 5,
    color: colors.black,
  },

  addedContainer: {
    paddingTop: 4,
    paddingLeft: 36,
  },
})
