import React from 'react'
import {
  FlatList,
  FlatListProps,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamingLive} from '#/components/icons/StreamingLive'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {Text} from '#/components/Typography'
// import {useOnboardingDispatch} from '#/state/shell'
import {useAnalytics} from '#/lib/analytics/analytics'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {IconCircle} from '#/components/IconCircle'
import {Image} from 'expo-image'
import {usePhotoLibraryPermission} from 'lib/hooks/usePermissions'
import {openCropper, openPicker} from 'lib/media/picker'
import {Emoji, EmojiName, emojiItems, emojiNames} from './types'
import {SelectImageButton} from '#/screens/Onboarding/StepProfile/SelectImageButton'

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
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const [avatar, setAvatar] = React.useState<Avatar>({
    placeholder: emojiItems.smile,
    backgroundColor: '#338388',
  })

  React.useEffect(() => {
    track('OnboardingV2:StepProfile:Start')
  }, [track])

  const onContinue = React.useCallback(() => {
    dispatch({type: 'next'})
    track('OnboardingV2:StepProfile:End')
  }, [track, dispatch])

  return (
    <SetAvatarContext.Provider value={setAvatar}>
      <AvatarContext.Provider value={avatar}>
        <View style={[a.align_start]}>
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

          <View style={[a.w_full, a.pt_5xl]}>
            <View style={[a.align_center, a.pb_5xl]}>
              <AvatarCircle />
            </View>
            <Items type="emojis" />
            <Items type="colors" />
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
      </AvatarContext.Provider>
    </SetAvatarContext.Provider>
  )
}

function AvatarCircle() {
  const t = useTheme()
  const avatar = useAvatar()
  const Icon = avatar.placeholder.component

  if (avatar.image) {
    return (
      <Image
        source={avatar.image.path}
        style={[styles.imageContainer, t.atoms.border_contrast_high]}
        accessibilityIgnoresInvertColors
      />
    )
  }

  return (
    <View
      style={[
        styles.imageContainer,
        {backgroundColor: avatar.backgroundColor},
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
          borderWidth: avatar.placeholder ? 4 : 2,
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
  if (type === 'colors') {
    return (
      <View style={styles.flatListOuter}>
        <FlatList<Color>
          data={colors}
          renderItem={colorRenderItem}
          {...commonFlatListProps}
        />
      </View>
    )
  }

  return (
    <View style={styles.flatListOuter}>
      <FlatList<EmojiName>
        data={emojiNames}
        renderItem={emojiRenderItem}
        {...commonFlatListProps}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 100,
    height: 150,
    width: 150,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteContainer: {
    height: 80,
    width: 80,
    marginHorizontal: 5,
  },
  flatListOuter: {
    height: 100,
  },
  flatListContainer: {
    paddingLeft: 40,
    paddingRight: 40,
  },
})

const commonFlatListProps: Partial<FlatListProps<any>> = {
  horizontal: true,
  contentContainerStyle: styles.flatListContainer,
  showsHorizontalScrollIndicator: false,
}
