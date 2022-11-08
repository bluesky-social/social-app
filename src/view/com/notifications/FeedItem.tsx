import React, {useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {Image, StyleSheet, Text, View} from 'react-native'
import {AtUri} from '../../../third-party/uri'
import {FontAwesomeIcon, Props} from '@fortawesome/react-native-fontawesome'
import {NotificationsViewItemModel} from '../../../state/models/notifications-view'
import {s, colors} from '../../lib/styles'
import {ago, pluralize} from '../../lib/strings'
import {UpIconSolid} from '../../lib/icons'
import {UserAvatar} from '../util/UserAvatar'
import {PostText} from '../post/PostText'
import {Post} from '../post/Post'
import {Link} from '../util/Link'

const MAX_AUTHORS = 8

export const FeedItem = observer(function FeedItem({
  item,
}: {
  item: NotificationsViewItemModel
}) {
  const itemHref = useMemo(() => {
    if (item.isUpvote || item.isRepost) {
      const urip = new AtUri(item.subjectUri)
      return `/profile/${urip.host}/post/${urip.rkey}`
    } else if (item.isFollow) {
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
    } else if (item.isFollow) {
      return item.author.handle
    } else if (item.isReply) {
      return 'Post'
    }
  }, [item])

  if (item.isReply) {
    return (
      <Link
        style={[
          styles.outerMinimal,
          item.isRead ? undefined : styles.outerUnread,
        ]}
        href={itemHref}
        title={itemTitle}>
        <Post uri={item.uri} />
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
  } else if (item.isReply) {
    action = 'replied to your post'
    icon = ['far', 'comment']
  } else if (item.isFollow) {
    action = 'followed you'
    icon = 'user-plus'
    iconStyle = [s.blue3]
  } else {
    return <></>
  }

  let authors: {href: string; handle: string; displayName?: string}[] = [
    {
      href: `/profile/${item.author.handle}`,
      handle: item.author.handle,
      displayName: item.author.displayName,
    },
  ]
  if (item.additional?.length) {
    authors = authors.concat(
      item.additional.map(item2 => ({
        href: `/profile/${item2.author.handle}`,
        handle: item2.author.handle,
        displayName: item2.author.displayName,
      })),
    )
  }

  return (
    <Link
      style={[styles.outer, item.isRead ? undefined : styles.outerUnread]}
      href={itemHref}
      title={itemTitle}>
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
                style={s.mr2}
                key={author.href}
                href={author.href}
                title={`@${author.handle}`}>
                <UserAvatar
                  size={30}
                  displayName={author.displayName}
                  handle={author.handle}
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
            <Link
              key={authors[0].href}
              style={styles.metaItem}
              href={authors[0].href}
              title={`@${authors[0].handle}`}>
              <Text style={[s.f15, s.bold]}>
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
            <Text style={[styles.metaItem, s.f15]}>{action}</Text>
            <Text style={[styles.metaItem, s.f15, s.gray5]}>
              {ago(item.indexedAt)}
            </Text>
          </View>
          {item.isUpvote || item.isRepost ? (
            <PostText uri={item.subjectUri} style={[s.gray5]} />
          ) : (
            <></>
          )}
        </View>
      </View>
      {item.isReply ? (
        <View style={s.pt5}>
          <Post uri={item.uri} />
        </View>
      ) : (
        <></>
      )}
    </Link>
  )
})

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 6,
    margin: 2,
    marginBottom: 0,
  },
  outerMinimal: {
    backgroundColor: colors.white,
    borderRadius: 6,
    margin: 2,
    marginBottom: 0,
  },
  outerUnread: {
    borderWidth: 1,
    borderColor: colors.blue2,
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
    paddingTop: 6,
    paddingBottom: 2,
  },
  metaItem: {
    paddingRight: 3,
  },
  postText: {
    paddingBottom: 5,
  },
})
