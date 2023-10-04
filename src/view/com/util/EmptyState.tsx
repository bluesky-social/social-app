import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from './text/Text'
import {UserGroupIcon} from 'lib/icons'
import {usePalette} from 'lib/hooks/usePalette'

export function EmptyState({
  testID,
  icon,
  message,
  style,
}: {
  testID?: string
  icon: IconProp | 'user-group'
  message: string
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  return (
    <View testID={testID} style={[styles.container, pal.border, style]}>
      <View style={styles.iconContainer}>
        {icon === 'user-group' ? (
          <UserGroupIcon size="64" style={styles.icon} />
        ) : (
          <FontAwesomeIcon
            icon={icon}
            size={64}
            style={[
              styles.icon,
              {color: pal.colors.emptyStateIcon} as FontAwesomeIconStyle,
            ]}
          />
        )}
      </View>
      <Text
        type="xl-medium"
        style={[{color: pal.colors.textVeryLight}, styles.text]}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 36,
    borderTopWidth: 1,
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
    paddingTop: 20,
  },
})
