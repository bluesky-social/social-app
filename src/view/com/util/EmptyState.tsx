import React from 'react'
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserGroupIcon} from '../../lib/icons'
import {colors} from '../../lib/styles'

export function EmptyState({
  icon,
  message,
  style,
}: {
  icon: IconProp | 'user-group'
  message: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        {icon === 'user-group' ? (
          <UserGroupIcon size="64" style={styles.icon} />
        ) : (
          <FontAwesomeIcon icon={icon} size={64} style={styles.icon} />
        )}
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 36,
  },
  iconContainer: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 'auto',
    marginRight: 'auto',
    color: colors.gray3,
  },
  text: {
    textAlign: 'center',
    color: colors.gray5,
    paddingTop: 16,
    fontSize: 16,
  },
})
