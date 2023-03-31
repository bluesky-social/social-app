import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from './text/Text'
import {DesktopWebTextLink} from './Link'
import {ago} from 'lib/strings/time'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {UserAvatar} from './UserAvatar'
import {observer} from 'mobx-react-lite'
import FollowButton from '../profile/FollowButton'

interface PostMetaOpts {
  authorAvatar?: string
  authorHandle: string
  authorDisplayName: string | undefined
  postHref: string
  timestamp: string
  did?: string
  showFollowBtn?: boolean
}

export const PostMeta = observer(function (opts: PostMetaOpts) {
  const pal = usePalette('default')
  const displayName = opts.authorDisplayName || opts.authorHandle
  const handle = opts.authorHandle
  const store = useStores()
  const isMe = opts.did === store.me.did
  const isFollowing =
    typeof opts.did === 'string' && store.me.follows.isFollowing(opts.did)

  const [didFollow, setDidFollow] = React.useState(false)
  const onToggleFollow = React.useCallback(() => {
    setDidFollow(true)
  }, [setDidFollow])

  if (opts.showFollowBtn && !isMe && (!isFollowing || didFollow) && opts.did) {
    // two-liner with follow button
    return (
      <View style={styles.metaTwoLine}>
        <View style={styles.metaTwoLineLeft}>
          <View style={styles.metaTwoLineTop}>
            <DesktopWebTextLink
              type="lg-bold"
              style={pal.text}
              numberOfLines={1}
              lineHeight={1.2}
              text={displayName}
              href={`/profile/${opts.authorHandle}`}
            />
            <Text type="md" style={pal.textLight} lineHeight={1.2}>
              &nbsp;&middot;&nbsp;
            </Text>
            <DesktopWebTextLink
              type="md"
              style={[styles.metaItem, pal.textLight]}
              lineHeight={1.2}
              text={ago(opts.timestamp)}
              href={opts.postHref}
            />
          </View>
          <DesktopWebTextLink
            type="md"
            style={[styles.metaItem, pal.textLight]}
            lineHeight={1.2}
            numberOfLines={1}
            text={`@${handle}`}
            href={`/profile/${opts.authorHandle}`}
          />
        </View>

        <View>
          <FollowButton
            type="default"
            did={opts.did}
            onToggleFollow={onToggleFollow}
          />
        </View>
      </View>
    )
  }

  // one-liner
  return (
    <View style={styles.meta}>
      {typeof opts.authorAvatar !== 'undefined' && (
        <View style={[styles.metaItem, styles.avatar]}>
          <UserAvatar avatar={opts.authorAvatar} size={16} />
        </View>
      )}
      <View style={[styles.metaItem, styles.maxWidth]}>
        <DesktopWebTextLink
          type="lg-bold"
          style={pal.text}
          numberOfLines={1}
          lineHeight={1.2}
          text={
            <>
              {displayName}
              <Text type="md" style={[pal.textLight]}>
                &nbsp;{handle}
              </Text>
            </>
          }
          href={`/profile/${opts.authorHandle}`}
        />
      </View>
      <Text type="md" style={pal.textLight} lineHeight={1.2}>
        &middot;&nbsp;
      </Text>
      <DesktopWebTextLink
        type="md"
        style={[styles.metaItem, pal.textLight]}
        lineHeight={1.2}
        text={ago(opts.timestamp)}
        href={opts.postHref}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingBottom: 2,
  },
  metaTwoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 4,
  },
  metaTwoLineLeft: {
    flex: 1,
    paddingRight: 40,
  },
  metaTwoLineTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metaItem: {
    paddingRight: 5,
  },
  avatar: {
    alignSelf: 'center',
  },
  maxWidth: {
    maxWidth: '80%',
  },
})
