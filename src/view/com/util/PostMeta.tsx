import React from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import {Text} from './text/Text'
import {ago} from 'lib/strings/time'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import FollowButton from '../profile/FollowButton'

interface PostMetaOpts {
  authorHandle: string
  authorDisplayName: string | undefined
  timestamp: string
  did: string
  declarationCid: string
}

export const PostMeta = observer(function (opts: PostMetaOpts) {
  const pal = usePalette('default')
  let displayName = opts.authorDisplayName || opts.authorHandle
  let handle = opts.authorHandle
  const store = useStores()
  const isMe = opts.did === store.me.did
  const isFollowing = store.me.follows.isFollowing(opts.did)

  // HACK
  // Android simply cannot handle the truncation case we need
  // so we have to do it manually here
  // -prf
  if (Platform.OS === 'android') {
    if (displayName.length + handle.length > 26) {
      if (displayName.length > 26) {
        displayName = displayName.slice(0, 23) + '...'
      } else {
        handle = handle.slice(0, 23 - displayName.length) + '...'
        if (handle.endsWith('....')) {
          handle = handle.slice(0, -4) + '...'
        }
      }
    }
  }

  return (
    <View>
      <View style={styles.meta}>
        <View>
          <Text
            type="lg-bold"
            style={[pal.text]}
            numberOfLines={1}
            lineHeight={1.2}>
            {displayName}{' '}
            <Text
              type="md"
              style={[styles.metaItem, pal.textLight]}
              lineHeight={1.2}>
              &middot; {ago(opts.timestamp)}
            </Text>
          </Text>
          <Text
            type="md"
            style={[styles.metaItem, pal.textLight]}
            lineHeight={1.2}>
            {handle ? (
              <Text type="md" style={[pal.textLight]}>
                @{handle}
              </Text>
            ) : undefined}
          </Text>
        </View>

        <View>
          {isFollowing || isMe ? null : (
            <FollowButton did={opts.did} declarationCid={opts.declarationCid} />
          )}
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  metaItem: {
    paddingRight: 5,
  },
  maxWidth: {
    maxWidth: '80%',
  },
})
