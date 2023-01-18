import React from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import {Link} from '../util/Link'
import {Text} from './text/Text'
import {ago} from '../../../lib/strings'
import {usePalette} from '../../lib/hooks/usePalette'

interface PostMetaOpts {
  authorHref: string
  authorHandle: string
  authorDisplayName: string | undefined
  timestamp: string
}

export function PostMeta(opts: PostMetaOpts) {
  const pal = usePalette('default')
  let displayName = opts.authorDisplayName || opts.authorHandle
  let handle = opts.authorHandle

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
    <View style={styles.meta}>
      <Link
        style={[styles.metaItem, styles.maxWidth]}
        href={opts.authorHref}
        title={opts.authorHandle}>
        <Text type="lg-bold" style={[pal.text]} numberOfLines={1}>
          {displayName}
          {handle ? (
            <Text type="md" style={[pal.textLight]}>
              &nbsp;{handle}
            </Text>
          ) : undefined}
        </Text>
      </Link>
      <Text type="md" style={[styles.metaItem, pal.textLight]}>
        &middot; {ago(opts.timestamp)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingTop: 0,
    paddingBottom: 2,
  },
  metaItem: {
    paddingRight: 5,
  },
  maxWidth: {
    maxWidth: '80%',
  },
})
