import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../text/Text'
import {ModerationBehavior, ModerationBehaviorCode} from 'lib/labeling/types'
import {isDesktopWeb} from 'platform/detection'

export function ImageHider({
  testID,
  moderation,
  style,
  children,
}: React.PropsWithChildren<{
  testID?: string
  moderation: ModerationBehavior
  style?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)
  const onPressShow = React.useCallback(() => {
    setOverride(true)
  }, [setOverride])
  const onPressHide = React.useCallback(() => {
    setOverride(false)
  }, [setOverride])

  if (moderation.behavior === ModerationBehaviorCode.Hide) {
    return null
  }

  if (moderation.behavior !== ModerationBehaviorCode.WarnImages) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  return (
    <View testID={testID} style={style}>
      {override ? (
        <View>
          <Pressable
            onPress={onPressHide}
            style={[styles.hideBtn, pal.viewLight]}
            accessibilityLabel="Hide image"
            accessibilityHint="">
            <Text type="xl-bold" style={pal.link}>
              Hide
            </Text>
          </Pressable>
          {children}
        </View>
      ) : (
        <View style={[styles.cover, pal.viewLight]}>
          <Pressable
            onPress={onPressShow}
            style={[styles.showBtn, pal.view]}
            accessibilityLabel="Show image"
            accessibilityHint="">
            <Text type="xl" style={pal.text}>
              {moderation.reason || 'Content warning'}
            </Text>
            <Text type="xl-bold" style={pal.link}>
              Show
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  overrideContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  cover: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: isDesktopWeb ? 2 : 1.5,
    marginBottom: 10,
  },
  coverOpen: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  showBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
  },
  hideBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
})
