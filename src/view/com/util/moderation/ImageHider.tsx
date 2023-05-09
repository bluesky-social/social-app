import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../text/Text'
import {BlurView} from '../BlurView'
import {ModerationBehavior, ModerationBehaviorCode} from 'lib/labeling/types'
import {isAndroid} from 'platform/detection'

export function ImageHider({
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

  if (moderation.behavior !== ModerationBehaviorCode.WarnImages) {
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
    <View style={[styles.container, containerStyle]}>
      <View testID={testID} style={style}>
        {children}
      </View>
      {override ? (
        <Pressable
          onPress={onPressHide}
          style={[styles.hideBtn, pal.view]}
          accessibilityLabel="Hide image"
          accessibilityHint="Rehides the image">
          <Text type="xl-bold" style={pal.link}>
            Hide
          </Text>
        </Pressable>
      ) : (
        <>
          {isAndroid ? (
            /* android has an issue that breaks the blurview */
            /* see https://github.com/Kureev/react-native-blur/issues/486 */
            <View style={[pal.viewLight, styles.overlay, styles.coverView]} />
          ) : (
            <BlurView
              style={[styles.overlay, styles.blurView]}
              blurType="light"
              blurAmount={100}
              reducedTransparencyFallbackColor="white"
            />
          )}
          <View style={[styles.overlay, styles.info]}>
            <Pressable
              onPress={onPressShow}
              style={[styles.showBtn, pal.view]}
              accessibilityLabel="Show image"
              accessibilityHint="Shows image hidden based on your moderation settings">
              <Text type="xl" style={pal.text}>
                {moderation.reason || 'Content warning'}
              </Text>
              <Text type="xl-bold" style={pal.link}>
                Show
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 10,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  blurView: {
    borderRadius: 8,
  },
  coverView: {
    borderRadius: 8,
  },
  info: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  showBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
  },
  hideBtn: {
    position: 'absolute',
    left: 8,
    bottom: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
})
