import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from './text/Text'
import {DesktopWebTextLink} from './Link'
import {ago, niceDate} from 'lib/strings/time'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {UserAvatar} from './UserAvatar'
import {observer} from 'mobx-react-lite'
import {FollowButton} from '../profile/FollowButton'
import {FollowState} from 'state/models/cache/my-follows'
import {sanitizeDisplayName} from 'lib/strings/display-names'

interface PostMetaOpts {
  authorAvatar?: string
  authorHandle: string
  authorDisplayName: string | undefined
  authorHasWarning: boolean
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
  const followState =
    typeof opts.did === 'string'
      ? store.me.follows.getFollowState(opts.did)
      : FollowState.Unknown

  const [didFollow, setDidFollow] = React.useState(false)
  const onToggleFollow = React.useCallback(() => {
    setDidFollow(true)
  }, [setDidFollow])

  if (
    opts.showFollowBtn &&
    !isMe &&
    (followState === FollowState.NotFollowing || didFollow) &&
    opts.did
  ) {
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
              text={sanitizeDisplayName(displayName)}
              href={`/profile/${opts.authorHandle}`}
            />
            <Text
              type="md"
              style={pal.textLight}
              lineHeight={1.2}
              accessible={false}>
              &nbsp;&middot;&nbsp;
            </Text>
            <DesktopWebTextLink
              type="md"
              style={[styles.metaItem, pal.textLight]}
              lineHeight={1.2}
              text={ago(opts.timestamp)}
              accessibilityLabel={niceDate(opts.timestamp)}
              accessibilityHint=""
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
            unfollowedType="default"
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
          <UserAvatar
            avatar={opts.authorAvatar}
            size={16}
            // TODO moderation
          />
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
              {sanitizeDisplayName(displayName)}
              <Text
                type="md"
                style={[pal.textLight]}
                numberOfLines={1}
                lineHeight={1.2}>
                &nbsp;@{handle}
              </Text>
            </>
          }
          href={`/profile/${opts.authorHandle}`}
        />
      </View>
      <Text type="md" style={pal.textLight} lineHeight={1.2} accessible={false}>
        &middot;&nbsp;
      </Text>
      <DesktopWebTextLink
        type="md"
        style={[styles.metaItem, pal.textLight]}
        lineHeight={1.2}
        text={ago(opts.timestamp)}
        accessibilityLabel={niceDate(opts.timestamp)}
        accessibilityHint=""
        href={opts.postHref}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
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
