import React from 'react'
import {
  FlatList,
  FlatListProps,
  LayoutAnimation,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamingLive} from '#/components/icons/StreamingLive'
import {useAnalytics} from '#/lib/analytics/analytics'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {IconCircle} from '#/components/IconCircle'
import {Image} from 'expo-image'
import {
  Emoji,
  EmojiName,
  emojiItems,
  emojiNames,
  AvatarColor,
  avatarColors,
} from './types'
import {
  PlaceholderCanvas,
  PlaceholderCanvasRef,
} from '#/screens/Onboarding/StepProfile/PlaceholderCanvas'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

interface Avatar {
  image?: {
    path: string
    mime: string
    size: number
    width: number
    height: number
  }
  backgroundColor: AvatarColor
  placeholder: Emoji
}

const WITH_TIMING_CONFIG = {duration: 100}

const AvatarContext = React.createContext<Avatar>({} as Avatar)
const SetAvatarContext = React.createContext<
  React.Dispatch<React.SetStateAction<Avatar>>
>({} as React.Dispatch<React.SetStateAction<Avatar>>)
export const useAvatar = () => React.useContext(AvatarContext)
export const useSetAvatar = () => React.useContext(SetAvatarContext)

export function StepProfile() {
  const {_} = useLingui()
  const t = useTheme()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {gtMobile} = useBreakpoints()
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const [avatar, setAvatar] = React.useState<Avatar>({
    placeholder: emojiItems.at,
    backgroundColor: avatarColors[0],
  })

  const canvasRef = React.useRef<PlaceholderCanvasRef>(null)

  React.useEffect(() => {
    track('OnboardingV2:StepProfile:Start')
  }, [track])

  const onContinue = React.useCallback(async () => {
    let imageUri = avatar?.image?.path
    let imageMime = avatar?.image?.mime
    if (!imageUri) {
      imageUri = await canvasRef.current?.capture()
    }

    if (imageUri) {
      dispatch({
        type: 'setProfileStepResults',
        imageUri,
        imageMime: imageMime ?? 'image/jpeg',
      })
    }

    dispatch({type: 'next'})
    track('OnboardingV2:StepProfile:End')
  }, [avatar?.image, dispatch, track])

  return (
    <SetAvatarContext.Provider value={setAvatar}>
      <AvatarContext.Provider value={avatar}>
        <>
          <View style={[a.align_start, t.atoms.bg]}>
            <View style={[gtMobile ? a.px_5xl : a.px_xl]}>
              <IconCircle icon={StreamingLive} style={[a.mb_2xl]} />

              <Title>
                <Trans>Set your profile picture</Trans>
              </Title>
              <Description>
                <Trans>
                  Help people know you're not a bot by uploading a picture or
                  creating an avatar!
                </Trans>
              </Description>
            </View>
            <View style={[a.w_full, a.pt_5xl]}>
              <View style={[a.align_center, a.pb_5xl]}>
                <AvatarCircle />
              </View>
              {!avatar.image && (
                <View
                  style={
                    isTabletOrDesktop
                      ? [a.flex_row, a.justify_between]
                      : undefined
                  }>
                  <Items type="emojis" />
                  <Items type="colors" />
                </View>
              )}
            </View>

            <OnboardingControls.Portal>
              <Button
                key={state.activeStep} // remove focus state on nav
                variant="gradient"
                color="gradient_sky"
                size="large"
                label={_(msg`Continue to next step`)}
                onPress={onContinue}>
                <ButtonText>
                  <Trans>Continue</Trans>
                </ButtonText>
                <ButtonIcon icon={ChevronRight} position="right" />
              </Button>
            </OnboardingControls.Portal>
          </View>
          <PlaceholderCanvas ref={canvasRef} />
        </>
      </AvatarContext.Provider>
    </SetAvatarContext.Provider>
  )
}

function AvatarCircle() {
  const t = useTheme()
  const styles = useStyles()
  const avatar = useAvatar()
  const setAvatar = useSetAvatar()
  const Icon = avatar.placeholder.component

  const onPressRemoveAvatar = React.useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setAvatar(prev => ({
      ...prev,
      image: undefined,
    }))
  }, [setAvatar])

  if (avatar.image) {
    return (
      <View>
        <Image
          source={avatar.image.path}
          style={[styles.imageContainer, t.atoms.border_contrast_high]}
          accessibilityIgnoresInvertColors
        />
        <Pressable
          accessibilityRole="button"
          style={[
            a.absolute,
            a.rounded_full,
            a.align_center,
            a.justify_center,
            a.border,
            a.shadow_lg,
            t.atoms.border_contrast_high,
            t.atoms.bg_contrast_300,
            {height: 40, width: 40, bottom: 5, right: 5},
          ]}
          onPress={onPressRemoveAvatar}>
          <Times size="lg" style={{color: t.palette.white}} />
        </Pressable>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.imageContainer,
        t.atoms.border_contrast_high,
        {
          backgroundColor: avatar.backgroundColor,
        },
      ]}>
      <Icon height={85} width={85} style={{color: t.palette.white}} />
    </View>
  )
}

function AnimatedCircle({
  selected,
  children,
}: React.PropsWithChildren<{selected: boolean}>) {
  const t = useTheme()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const styles = useStyles()
  const size = useSharedValue(selected ? 1.2 : 1)

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
function colorRenderItem({item}: ListRenderItemInfo<AvatarColor>) {
  return <ColorItem color={item} />
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
function emojiRenderItem({item}: ListRenderItemInfo<EmojiName>) {
  return <EmojiItem emojiName={item} />
}

function Items({type}: {type: 'emojis' | 'colors'}) {
  const {isTabletOrDesktop} = useWebMediaQueries()
  const styles = useStyles()

  return (
    <View style={styles.flatListOuter}>
      <FlatList
        // Changing the value of numColumns on the fly isn't supported, so we want the flatlist to re-render whenever
        // the size of the screen changes
        key={isTabletOrDesktop ? 0 : 1}
        data={type === 'colors' ? avatarColors : emojiNames}
        renderItem={type === 'colors' ? colorRenderItem : emojiRenderItem}
        style={[isTabletOrDesktop && {marginHorizontal: 10}]}
        contentContainerStyle={[
          a.align_center,
          {height: 100},
          !isTabletOrDesktop && styles.flatListContainer,
          isTabletOrDesktop && type === 'colors' && a.pr_xs,
        ]}
        numColumns={isTabletOrDesktop && type === 'emojis' ? 4 : undefined}
        showsHorizontalScrollIndicator={isTabletOrDesktop && type === 'colors'}
        horizontal={!isTabletOrDesktop}
        {...commonFlatListProps}
      />
    </View>
  )
}

const useStyles = () => {
  const {isTabletOrDesktop} = useWebMediaQueries()

  return StyleSheet.create({
    imageContainer: {
      borderRadius: 100,
      height: 150,
      width: 150,
      overflow: 'hidden',
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paletteContainer: {
      height: 70,
      width: 70,
      margin: isTabletOrDesktop ? 8 : 2,
    },
    flatListOuter: isTabletOrDesktop
      ? {
          height: 435,
        }
      : {
          flexDirection: 'row',
          alignItems: 'center',
          height: 100,
        },
    flatListContainer: {
      paddingHorizontal: 40,
    },
  })
}

const commonFlatListProps: Partial<FlatListProps<any>> = {}
