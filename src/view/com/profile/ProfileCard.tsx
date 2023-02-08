import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {s} from '../../lib/styles'
import {usePalette} from '../../lib/hooks/usePalette'

export function ProfileCard({
  handle,
  displayName,
  avatar,
  description,
  renderButton,
}: {
  handle: string
  displayName?: string
  avatar?: string
  description?: string
  renderButton?: () => JSX.Element
}) {
  const pal = usePalette('default')
  return (
    <Link
      style={[styles.outer, pal.view, pal.border]}
      href={`/profile/${handle}`}
      title={handle}
      noFeedback>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            displayName={displayName}
            handle={handle}
            avatar={avatar}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.bold, pal.text]} numberOfLines={1}>
            {displayName || handle}
          </Text>
          <Text type="sm" style={[pal.textLight]} numberOfLines={1}>
            @{handle}
          </Text>
        </View>
        {renderButton ? (
          <View style={styles.layoutButton}>{renderButton()}</View>
        ) : undefined}
      </View>
      {description ? (
        <View style={styles.details}>
          <Text style={pal.text} numberOfLines={4}>
            {description}
          </Text>
        </View>
      ) : undefined}
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    paddingHorizontal: 6,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutAvi: {
    width: 60,
    paddingLeft: 10,
    paddingTop: 8,
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  layoutButton: {
    paddingRight: 10,
  },
  details: {
    paddingLeft: 60,
    paddingRight: 10,
    paddingBottom: 10,
  },
})
