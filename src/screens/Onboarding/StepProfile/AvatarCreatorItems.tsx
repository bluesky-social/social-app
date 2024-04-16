import React from 'react'
import {ListRenderItemInfo, Pressable, View} from 'react-native'
// Using the FlatList from RNGH allows us to nest the scroll views on Android. The default FlatList won't allow
// scrolling inside of the vertical ScrollView
import {FlatList} from 'react-native-gesture-handler'

import {Avatar} from '#/screens/Onboarding/StepProfile/index'
import {
  AvatarColor,
  avatarColors,
  emojiItems,
  EmojiName,
  emojiNames,
} from '#/screens/Onboarding/StepProfile/types'
import {atoms as a, native, useBreakpoints, useTheme, web} from '#/alf'

function Circle({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()

  const styles = React.useMemo(
    () => ({
      container: [
        a.rounded_full,
        a.overflow_hidden,
        a.align_center,
        a.justify_center,
        t.atoms.bg_contrast_25,
        web({borderWidth: 2}),
        native({borderWidth: 1}),
        {
          height: 60,
          width: 60,
          margin: 4,
        },
      ],
    }),
    [t.atoms.bg_contrast_25],
  )

  return (
    <View style={[styles.container, t.atoms.border_contrast_high]}>
      {children}
    </View>
  )
}

function ColorItem({
  color,
  setAvatar,
}: {
  color: AvatarColor
  setAvatar: React.Dispatch<React.SetStateAction<Avatar>>
}) {
  const onPress = React.useCallback(() => {
    setAvatar(prev => ({
      ...prev,
      backgroundColor: color,
    }))
  }, [color, setAvatar])

  return (
    <Circle>
      <Pressable
        accessibilityRole="button"
        style={[a.h_full, a.w_full, {backgroundColor: color}]}
        onPress={onPress}
      />
    </Circle>
  )
}

function EmojiItem({
  emojiName,
  avatar,
  setAvatar,
}: {
  emojiName: EmojiName
  avatar: Avatar
  setAvatar: React.Dispatch<React.SetStateAction<Avatar>>
}) {
  const t = useTheme()
  const Icon = React.useMemo(() => emojiItems[emojiName].component, [emojiName])

  const onPress = React.useCallback(() => {
    setAvatar(prev => ({
      ...prev,
      placeholder: emojiItems[emojiName],
    }))
  }, [emojiName, setAvatar])

  const selected = React.useMemo(
    () => avatar.placeholder.name === emojiName,
    [avatar.placeholder.name, emojiName],
  )

  return (
    <Circle>
      <Pressable
        accessibilityRole="button"
        style={[a.flex_1, a.justify_center, a.align_center]}
        onPress={onPress}>
        <Icon
          style={selected ? t.atoms.text : t.atoms.text_contrast_low}
          height={30}
          width={30}
        />
      </Pressable>
    </Circle>
  )
}

export function AvatarCreatorItems({
  type,
  avatar,
  setAvatar,
}: {
  type: 'emojis' | 'colors'
  avatar: Avatar
  setAvatar: React.Dispatch<React.SetStateAction<Avatar>>
}) {
  const {gtMobile} = useBreakpoints()

  const styles = React.useMemo(
    () => ({
      flatListOuter: gtMobile
        ? {
            height: 338,
          }
        : [a.flex_row, a.align_center, {height: 70}],
    }),
    [gtMobile],
  )

  const colorRenderItem = React.useCallback(
    ({item}: ListRenderItemInfo<AvatarColor>) => {
      return <ColorItem color={item} setAvatar={setAvatar} />
    },
    [setAvatar],
  )

  const emojiRenderItem = React.useCallback(
    ({item}: ListRenderItemInfo<EmojiName>) => {
      return (
        <EmojiItem emojiName={item} avatar={avatar} setAvatar={setAvatar} />
      )
    },
    [avatar, setAvatar],
  )

  return (
    <View
      style={[
        styles.flatListOuter,
        gtMobile && type === 'colors' && {width: 125},
      ]}>
      <FlatList<any>
        // Changing the value of numColumns on the fly isn't supported, so we want the flatlist to re-render whenever
        // the size of the screen changes. Should only happen when `isTabletOrDesktop` changes.
        key={gtMobile ? 0 : 1}
        data={type === 'colors' ? avatarColors : emojiNames}
        renderItem={type === 'colors' ? colorRenderItem : emojiRenderItem}
        keyExtractor={item => item}
        style={[gtMobile && {marginHorizontal: 10}]}
        contentContainerStyle={[
          a.align_center,
          gtMobile && type === 'colors' && a.pr_xs,
          !gtMobile && {paddingHorizontal: 40},
        ]}
        numColumns={gtMobile && type === 'emojis' ? 4 : undefined}
        showsHorizontalScrollIndicator={gtMobile && type === 'colors'}
        horizontal={!gtMobile}
      />
    </View>
  )
}
