import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from './text/Text'
import {UserGroupIcon} from '../../lib/icons'
import {usePalette} from '../../lib/hooks/usePalette'

export function EmptyState({
  icon,
  message,
  style,
}: {
  icon: IconProp | 'user-group'
  message: string
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        {icon === 'user-group' ? (
          <UserGroupIcon size="64" style={styles.icon} />
        ) : (
          <FontAwesomeIcon
            icon={icon}
            size={64}
            style={[styles.icon, pal.textLight]}
          />
        )}
      </View>
      <Text type="body1" style={[pal.textLight, styles.text]}>
        {message}
      </Text>
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
  },
  text: {
    textAlign: 'center',
    paddingTop: 16,
  },
})
