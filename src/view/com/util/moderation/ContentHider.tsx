import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../text/Text'
import {addStyle} from 'lib/styles'
import {ModerationBehavior, ModerationBehaviorCode} from 'lib/labeling/types'

export function ContentHider({
  testID,
  moderation,
  style,
  containerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  moderation: ModerationBehavior
  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)

  if (
    moderation.behavior === ModerationBehaviorCode.Show ||
    moderation.behavior === ModerationBehaviorCode.Warn ||
    moderation.behavior === ModerationBehaviorCode.WarnImages
  ) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  if (moderation.behavior === ModerationBehaviorCode.Hide) {
    return null
  }

  return (
    <View style={[styles.container, pal.view, pal.border, containerStyle]}>
      <View
        style={[
          styles.description,
          pal.viewLight,
          override && styles.descriptionOpen,
        ]}>
        <Text type="md" style={pal.textLight}>
          {moderation.reason || 'Content warning'}
        </Text>
        <TouchableOpacity
          style={styles.showBtn}
          onPress={() => setOverride(v => !v)}>
          <Text type="md" style={pal.link}>
            {override ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      {override && (
        <View style={[styles.childrenContainer, pal.border]}>
          <View testID={testID} style={addStyle(style, styles.child)}>
            {children}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: 12,
  },
  descriptionOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  icon: {
    marginRight: 10,
  },
  showBtn: {
    marginLeft: 'auto',
  },
  childrenContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  child: {},
})
