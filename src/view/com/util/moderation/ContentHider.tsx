import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
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
  const onPressShow = React.useCallback(() => {
    setOverride(true)
  }, [setOverride])
  const onPressHide = React.useCallback(() => {
    setOverride(false)
  }, [setOverride])

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
      <Pressable
        onPress={override ? onPressHide : onPressShow}
        accessibilityLabel={override ? 'Hide post' : 'Show post'}
        // TODO: The text labelling should be split up so controls have unique roles
        accessibilityHint={
          override
            ? 'Re-hide post'
            : 'Shows post hidden based on your moderation settings'
        }
        style={[
          styles.description,
          pal.viewLight,
          override && styles.descriptionOpen,
        ]}>
        <Text type="md" style={pal.textLight}>
          {moderation.reason || 'Content warning'}
        </Text>
        <View style={styles.showBtn}>
          <Text type="md-medium" style={pal.link}>
            {override ? 'Hide' : 'Show'}
          </Text>
        </View>
      </Pressable>
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
