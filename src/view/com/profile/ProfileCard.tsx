import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Link} from '../util/Link'
import {Text} from '../util/Text'
import {UserAvatar} from '../util/UserAvatar'
import {s, colors} from '../../lib/styles'

export function ProfileCard({
  did,
  handle,
  displayName,
  avatar,
  renderButton,
  onPressButton,
}: {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  renderButton?: () => JSX.Element
  onPressButton?: () => void
}) {
  return (
    <Link
      style={styles.outer}
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
          <Text style={[s.f16, s.bold, s.black]} numberOfLines={1}>
            {displayName || handle}
          </Text>
          <Text style={[s.f15, s.gray5]} numberOfLines={1}>
            @{handle}
          </Text>
        </View>
        {renderButton ? (
          <View style={styles.layoutButton}>
            <TouchableOpacity onPress={onPressButton} style={styles.btn}>
              {renderButton()}
            </TouchableOpacity>
          </View>
        ) : undefined}
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    marginTop: 1,
    backgroundColor: colors.white,
    borderRadius: 6,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'center',
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
  layoutButton: {
    paddingRight: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 50,
    backgroundColor: colors.gray1,
    marginLeft: 6,
  },
})
