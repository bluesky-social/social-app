import React from 'react'
import {FlatList, ListRenderItemInfo, Pressable, View} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {atoms as a, useTheme} from '#/alf'
import {useAvatar, useSetAvatar} from '#/screens/Onboarding/StepProfile/index'
import {
  AvatarColor,
  avatarColors,
  emojiItems,
  EmojiName,
  emojiNames,
} from '#/screens/Onboarding/StepProfile/types'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

const WITH_TIMING_CONFIG = {duration: 150}

function AnimatedCircle({
  selected,
  children,
}: React.PropsWithChildren<{selected: boolean}>) {
  const t = useTheme()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const size = useSharedValue(selected ? 1.2 : 1)

  const styles = React.useMemo(
    () => ({
      imageContainer: [
        a.rounded_full,
        a.overflow_hidden,
        a.align_center,
        a.justify_center,
        {height: 150, width: 150, borderWidth: 2},
      ],
      paletteContainer: {
        height: 70,
        width: 70,
        margin: isTabletOrDesktop ? 8 : 2,
      },
    }),
    [isTabletOrDesktop],
  )

  React.useEffect(() => {
    if (selected && size.value !== 1.2) {
      size.value = withTiming(1.2, WITH_TIMING_CONFIG)
    } else if (!selected && size.value !== 1) {
      size.value = withTiming(1, WITH_TIMING_CONFIG)
    }
  }, [selected, size])

  // On mobile we want to expand the height/width of the container so the items around it get moved as well. On
  // desktop, we don't want anything around the item to move so we just increase the scale.
  const animatedStyle = useAnimatedStyle(() => {
    if (isTabletOrDesktop) {
      return {
        transform: [{scale: size.value}],
      }
    }
    return {
      height: 70 * size.value,
      width: 70 * size.value,
    }
  })

  return (
    <Animated.View
      style={[
        styles.imageContainer,
        styles.paletteContainer,
        t.atoms.border_contrast_high,
        animatedStyle,
      ]}>
      {children}
    </Animated.View>
  )
}

function ColorItem({color}: {color: AvatarColor}) {
  const avatar = useAvatar()
  const setAvatar = useSetAvatar()

  const onPress = React.useCallback(() => {
    setAvatar(prev => ({
      ...prev,
      backgroundColor: color,
    }))
  }, [color, setAvatar])

  return (
    <AnimatedCircle selected={avatar.backgroundColor === color}>
      <Pressable
        accessibilityRole="button"
        style={[a.h_full, a.w_full, {backgroundColor: color}]}
        onPress={onPress}
      />
    </AnimatedCircle>
  )
}

function EmojiItem({emojiName}: {emojiName: EmojiName}) {
  const t = useTheme()
  const avatar = useAvatar()
  const setAvatar = useSetAvatar()
  const Icon = React.useMemo(() => emojiItems[emojiName].component, [emojiName])

  const onPress = React.useCallback(() => {
    setAvatar(prev => ({
      ...prev,
      placeholder: emojiItems[emojiName],
    }))
  }, [emojiName, setAvatar])

  return (
    <AnimatedCircle selected={avatar.placeholder.name === emojiName}>
      <Pressable
        accessibilityRole="button"
        style={[a.flex_1, a.justify_center, a.align_center]}
        onPress={onPress}>
        <Icon style={[t.atoms.text_contrast_medium]} height={40} width={40} />
      </Pressable>
    </AnimatedCircle>
  )
}

function colorRenderItem({item}: ListRenderItemInfo<AvatarColor>) {
  return <ColorItem color={item} />
}
function emojiRenderItem({item}: ListRenderItemInfo<EmojiName>) {
  return <EmojiItem emojiName={item} />
}

export function AvatarCreatorItems({type}: {type: 'emojis' | 'colors'}) {
  const {isTabletOrDesktop} = useWebMediaQueries()

  const styles = React.useMemo(
    () => ({
      flatListOuter: isTabletOrDesktop
        ? {
            height: 435,
          }
        : [a.flex_row, a.align_center, {height: 100}],
    }),
    [isTabletOrDesktop],
  )

  return (
    <View
      style={[
        styles.flatListOuter,
        isTabletOrDesktop && type === 'colors' && {width: 125},
      ]}>
      <FlatList<any>
        // Changing the value of numColumns on the fly isn't supported, so we want the flatlist to re-render whenever
        // the size of the screen changes. Should only happen when `isTabletOrDesktop` changes.
        key={isTabletOrDesktop ? 0 : 1}
        data={type === 'colors' ? avatarColors : emojiNames}
        renderItem={type === 'colors' ? colorRenderItem : emojiRenderItem}
        style={[isTabletOrDesktop && {marginHorizontal: 10}]}
        contentContainerStyle={[
          a.align_center,
          isTabletOrDesktop && type === 'colors' && a.pr_xs,
          !isTabletOrDesktop && {paddingHorizontal: 40},
        ]}
        numColumns={isTabletOrDesktop && type === 'emojis' ? 4 : undefined}
        showsHorizontalScrollIndicator={isTabletOrDesktop && type === 'colors'}
        horizontal={!isTabletOrDesktop}
      />
    </View>
  )
}
