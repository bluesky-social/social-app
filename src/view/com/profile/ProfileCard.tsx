import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Link} from '../util/Link'
import {UserAvatar} from '../util/UserAvatar'
import {s, colors} from '../../lib/styles'

export function ProfileCard({
  did,
  handle,
  displayName,
  description,
}: {
  did: string
  handle: string
  displayName?: string
  description?: string
}) {
  return (
    <Link style={styles.outer} href={`/profile/${handle}`} title={handle}>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar size={40} displayName={displayName} handle={handle} />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.f16, s.bold]}>{displayName || handle}</Text>
          <Text style={[s.f15, s.gray5]}>@{handle}</Text>
        </View>
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    marginTop: 1,
    backgroundColor: colors.white,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 60,
    paddingLeft: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
})
