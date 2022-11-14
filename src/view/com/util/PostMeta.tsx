import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Link} from '../util/Link'
import {PostDropdownBtn} from '../util/DropdownBtn'
import {s} from '../../lib/styles'
import {ago} from '../../lib/strings'

interface PostMetaOpts {
  itemHref: string
  itemTitle: string
  authorHref: string
  authorHandle: string
  authorDisplayName: string | undefined
  timestamp: string
}

export function PostMeta(opts: PostMetaOpts) {
  return (
    <View style={styles.meta}>
      <View style={styles.metaNames}>
        <Link
          style={styles.metaItem}
          href={opts.authorHref}
          title={opts.authorHandle}>
          <Text style={[s.f17, s.bold]} numberOfLines={1}>
            {opts.authorDisplayName || opts.authorHandle}
          </Text>
        </Link>
        <Link
          style={styles.metaItem}
          href={opts.authorHref}
          title={opts.authorHandle}>
          <Text style={[s.f15, s.gray5]} numberOfLines={1}>
            @{opts.authorHandle}
          </Text>
        </Link>
      </View>
      <Text style={[styles.metaItem, s.f15, s.gray5]}>
        &middot; {ago(opts.timestamp)}
      </Text>
      <View style={s.flex1} />
      <PostDropdownBtn
        style={styles.metaItem}
        itemHref={opts.itemHref}
        itemTitle={opts.itemTitle}>
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
  metaNames: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    maxWidth: 240,
    overflow: 'hidden',
  },
  metaItem: {
    maxWidth: 240,
    paddingRight: 5,
  },
})
