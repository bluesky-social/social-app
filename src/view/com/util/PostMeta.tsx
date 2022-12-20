import React from 'react'
import {StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Link} from '../util/Link'
import {Text} from '../util/Text'
import {PostDropdownBtn} from '../util/DropdownBtn'
import {s} from '../../lib/styles'
import {ago} from '../../../lib/strings'

interface PostMetaOpts {
  itemHref: string
  itemTitle: string
  authorHref: string
  authorHandle: string
  authorDisplayName: string | undefined
  timestamp: string
  isAuthor: boolean
  onCopyPostText: () => void
  onDeletePost: () => void
}

export function PostMeta(opts: PostMetaOpts) {
  let displayName = opts.authorDisplayName || opts.authorHandle
  let handle = opts.authorHandle

  // HACK
  // Android simply cannot handle the truncation case we need
  // so we have to do it manually here
  // -prf
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

  return (
    <View style={styles.meta}>
      <Link
        style={styles.metaItem}
        href={opts.authorHref}
        title={opts.authorHandle}>
        <Text style={[s.f17, s.bold, s.black]} numberOfLines={1}>
          {displayName}
          {handle ? (
            <Text style={[s.f15, s.gray5, s.normal, s.black]}>
              &nbsp;{handle}
            </Text>
          ) : undefined}
        </Text>
      </Link>
      <Text style={[styles.metaItem, s.f15, s.gray5]}>
        &middot; {ago(opts.timestamp)}
      </Text>
      <View style={s.flex1} />
      <PostDropdownBtn
        style={[styles.metaItem, s.pl5]}
        itemHref={opts.itemHref}
        itemTitle={opts.itemTitle}
        isAuthor={opts.isAuthor}
        onCopyPostText={opts.onCopyPostText}
        onDeletePost={opts.onDeletePost}>
        <FontAwesomeIcon icon="ellipsis-h" size={14} style={[s.mt2, s.mr5]} />
      </PostDropdownBtn>
    </View>
  )
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 2,
  },
  metaItem: {
    paddingRight: 5,
  },
})
