import React from 'react'
import {
  FlatList,
  FlatListProps,
  LayoutAnimation,
  LayoutChangeEvent,
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
import {
  ChevronLeft_Stroke2_Corner0_Rounded,
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRight,
} from '#/components/icons/Chevron'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {IconCircle} from '#/components/IconCircle'
import {Image} from 'expo-image'
import {Emoji, EmojiName, emojiItems, emojiNames} from './types'
import {SelectImageButton} from '#/screens/Onboarding/StepProfile/SelectImageButton'
import {
  PlaceholderCanvas,
  PlaceholderCanvasRef,
} from '#/screens/Onboarding/StepProfile/PlaceholderCanvas'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

interface Avatar {
  image?: {
    path: string
    mime: string
    size: number
    width: number
    height: number
  }
  backgroundColor: Color
  placeholder: Emoji
}

const AvatarContext = React.createContext<Avatar>({} as Avatar)
const SetAvatarContext = React.createContext<
  React.Dispatch<React.SetStateAction<Avatar>>
>({} as React.Dispatch<React.SetStateAction<Avatar>>)
export const useAvatar = () => React.useContext(AvatarContext)
export const useSetAvatar = () => React.useContext(SetAvatarContext)

export function StepProfile() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const [avatar, setAvatar] = React.useState<Avatar>({
    placeholder: emojiItems.at,
    backgroundColor: '#338388',
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
                <>
                  <Items type="emojis" />
                  <Items type="colors" />
                </>
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
          <Times size="lg" style={{color: 'white'}} />
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
      <Icon height={85} width={85} style={{color: 'white'}} />
    </View>
  )
}

const colors = [
  '#338388',
  '#4ABFBD',
  '#8AB17D',
  '#E9C46A',
  '#F4A261',
  '#E76F51',
] as const
type Color = (typeof colors)[number]

function ColorItem({color}: {color: Color}) {
  const t = useTheme()
  const avatar = useAvatar()
  const setAvatar = useSetAvatar()

  const onPress = React.useCallback(() => {
    setAvatar(prev => ({
      ...prev,
      backgroundColor: color,
    }))
  }, [color, setAvatar])

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        styles.imageContainer,
        styles.paletteContainer,
        t.atoms.border_contrast_high,
        {
          backgroundColor: color,
          borderWidth: avatar.backgroundColor === color ? 4 : 2,
        },
      ]}
      onPress={onPress}
    />
  )
}
function colorRenderItem({item}: ListRenderItemInfo<Color>) {
  return <ColorItem color={item} />
}

function EmojiItem({emojiName}: {emojiName: EmojiName}) {
  const t = useTheme()
  const avatar = useAvatar()
  const setAvatar = useSetAvatar()
  const Icon = emojiItems[emojiName].component

  const onPress = React.useCallback(() => {
    setAvatar(prev => ({
      ...prev,
      placeholder: emojiItems[emojiName],
    }))
  }, [emojiName, setAvatar])

  if (emojiName === 'camera') {
    return <SelectImageButton />
  }

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        styles.imageContainer,
        styles.paletteContainer,
        t.atoms.border_contrast_high,
        {
          borderWidth: avatar.placeholder.name === emojiName ? 4 : 2,
        },
      ]}
      onPress={onPress}>
      <Icon height={35} width={35} style={[t.atoms.text_contrast_medium]} />
    </Pressable>
  )
}
function emojiRenderItem({item}: ListRenderItemInfo<EmojiName>) {
  return <EmojiItem emojiName={item} />
}

function Items({type}: {type: 'emojis' | 'colors'}) {
  const t = useTheme()
  const {isTabletOrDesktop} = useWebMediaQueries()

  const maxWidth = React.useRef(0)
  const width = React.useRef(0)
  const page = React.useRef(0)
  const ref = React.useRef<FlatList>(null)

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    width.current = e.nativeEvent.layout.width
  }, [])

  const onContentSizeChanged = React.useCallback((w: number, _: number) => {
    maxWidth.current = w
  }, [])

  const onLeftPress = React.useCallback(() => {
    if (page.current === 0) return
    page.current -= 1
    ref.current?.scrollToOffset({
      offset: width.current * page.current - width.current + 50,
    })
  }, [])

  const onRightPress = React.useCallback(() => {
    const newOffset = width.current * (page.current + 1) - 50
    if (newOffset >= maxWidth.current + width.current) return

    page.current += 1
    ref.current?.scrollToOffset({
      offset: newOffset,
    })
  }, [])

  return (
    <View style={styles.flatListOuter}>
      {isTabletOrDesktop && (
        <Pressable
          onPress={onLeftPress}
          style={[
            a.align_center,
            a.justify_center,
            t.atoms.bg_contrast_100,
            {height: 40, width: 40, borderRadius: 100},
          ]}
          accessibilityRole="button">
          <ChevronLeft_Stroke2_Corner0_Rounded style={t.atoms.text} />
        </Pressable>
      )}
      <FlatList
        data={type === 'colors' ? colors : emojiNames}
        renderItem={type === 'colors' ? colorRenderItem : emojiRenderItem}
        ref={ref}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChanged}
        style={[isTabletOrDesktop && {marginHorizontal: 10}]}
        contentContainerStyle={
          !isTabletOrDesktop ? styles.flatListContainer : undefined
        }
        {...commonFlatListProps}
      />
      {isTabletOrDesktop && (
        <Pressable
          onPress={onRightPress}
          style={[
            a.align_center,
            a.justify_center,
            t.atoms.bg_contrast_100,
            {height: 40, width: 40, borderRadius: 100},
          ]}
          accessibilityRole="button">
          <ChevronRight style={t.atoms.text} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
    height: 80,
    width: 80,
    marginHorizontal: 5,
  },
  flatListOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
  },
  flatListContainer: {
    paddingLeft: 40,
    paddingRight: 40,
  },
})

const commonFlatListProps: Partial<FlatListProps<any>> = {
  horizontal: true,
  showsHorizontalScrollIndicator: false,
}
