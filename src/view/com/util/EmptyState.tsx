import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {UserGroupIcon} from '#/lib/icons'
import {Growth_Stroke2_Corner0_Rounded as Growth} from '#/components/icons/Growth'
import {Text} from './text/Text'

export function EmptyState({
  testID,
  icon,
  message,
  style,
}: {
  testID?: string
  icon: IconProp | 'user-group' | 'growth'
  message: string
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const {isTabletOrDesktop} = useWebMediaQueries()
  const iconSize = isTabletOrDesktop ? 64 : 48
  return (
    <View
      testID={testID}
      style={[isTabletOrDesktop && {paddingRight: 20}, style]}>
      <View
        style={[
          styles.iconContainer,
          isTabletOrDesktop && styles.iconContainerBig,
          pal.viewLight,
        ]}>
        {icon === 'user-group' ? (
          <UserGroupIcon size={iconSize} />
        ) : icon === 'growth' ? (
          <Growth width={iconSize} fill={pal.colors.emptyStateIcon} />
        ) : (
          <FontAwesomeIcon
            icon={icon}
            size={iconSize}
            style={[{color: pal.colors.emptyStateIcon} as FontAwesomeIconStyle]}
          />
        )}
      </View>
      <Text type="xl" style={[{color: pal.colors.textLight}, styles.text]}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    width: 80,
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: 80,
    marginTop: 30,
  },
  iconContainerBig: {
    width: 100,
    height: 100,
    marginTop: 50,
  },
  text: {
    textAlign: 'center',
    paddingTop: 20,
  },
})
