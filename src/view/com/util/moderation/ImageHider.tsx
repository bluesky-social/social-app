import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {ModerationUI} from '@atproto/api'
import {Text} from '../text/Text'
import {isDesktopWeb} from 'platform/detection'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'

export function ImageHider({
  testID,
  moderation,
  style,
  children,
}: React.PropsWithChildren<{
  testID?: string
  moderation: ModerationUI
  style?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)
  const onPressToggle = React.useCallback(() => {
    if (!moderation.noOverride) {
      setOverride(v => !v)
    }
  }, [setOverride, moderation.noOverride])

  if (!moderation.blur) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  return (
    <View testID={testID} style={style}>
      <View style={[styles.cover, pal.viewLight]}>
        <Pressable
          onPress={onPressToggle}
          style={[styles.toggleBtn]}
          accessibilityLabel="Show image"
          accessibilityHint="">
          <FontAwesomeIcon
            icon={override ? 'eye' : ['far', 'eye-slash']}
            size={24}
            style={pal.text as FontAwesomeIconStyle}
          />
          <Text type="lg" style={pal.text}>
            {/* TODO moderation.reason ||*/ 'Content warning'}
          </Text>
          <View style={styles.flex1} />
          {!moderation.noOverride && (
            <Text type="xl-bold" style={pal.link}>
              {override ? 'Hide' : 'Show'}
            </Text>
          )}
        </Pressable>
      </View>
      {override && children}
    </View>
  )
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 8,
    marginTop: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: isDesktopWeb ? 24 : 20,
    paddingVertical: isDesktopWeb ? 20 : 18,
  },
  flex1: {
    flex: 1,
  },
})
