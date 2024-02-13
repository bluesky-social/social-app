import React from 'react'
import {
  ColorValue,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  View,
} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {News2_Stroke2_Corner0_Rounded as News} from '#/components/icons/News2'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamingLive} from '#/components/icons/StreamingLive'
import {Text} from '#/components/Typography'
import {useOnboardingDispatch} from '#/state/shell'
import {Loader} from '#/components/Loader'
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
import {usePalette} from 'lib/hooks/usePalette'
import {configurableLabelGroups} from 'state/queries/preferences'

type AvatarPlaceholder = 'thinking' | 'heart' | 'laughing'

interface Avatar {
  imageUri?: string
  backgroundColor?: ColorValue
  placeholder?: AvatarPlaceholder
}

export function StepProfile() {
  const {_} = useLingui()
  const t = useTheme()
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const onboardDispatch = useOnboardingDispatch()
  const [avatar, setAvatar] = React.useState<Avatar>({})

  React.useEffect(() => {
    track('OnboardingV2:StepProfile:Start')
  }, [track])

  const onContinue = React.useCallback(() => {
    dispatch({type: 'next'})
    track('OnboardingV2:StepProfile:End')
  }, [track, dispatch])

  return (
    <View style={[a.align_start]}>
      <IconCircle icon={StreamingLive} style={[a.mb_2xl]} />

      <Title>
        <Trans>Upload a profile picture</Trans>
      </Title>
      <Description>
        <Trans>Help people know you're not a bot!</Trans>
      </Description>

      <View style={[a.pt_5xl, a.gap_3xl]}>
        <Items type="colors" />
        <Items type="emojis" />
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
  )
}

function AvatarCircle({
  avatar,
  setAvatar,
}: {
  avatar: Avatar
  setAvatar: React.Dispatch<React.SetStateAction<Avatar>>
}) {
  if (avatar.imageUri) {
    return (
      <View style={[styles.imageContainer]}>
        <Image
          source={avatar.imageUri}
          style={{flex: 1}}
          accessibilityIgnoresInvertColors
        />
      </View>
    )
  }

  return (
    <View
      style={[styles.imageContainer, {backgroundColor: avatar.backgroundColor}]}
    />
  )
}

const colors = ['image', 'red', 'blue', 'green', 'orange'] as const
type Color = (typeof colors)[number]

const emojis = ['smile', 'frown', 'eyes'] as const
type Emoji = (typeof emojis)[number]
const emojiItems: Record<Emoji, string> = {
  smile: '😊',
  frown: '☹️',
  eyes: '👀',
}

function ColorItem({color}: {color: Color}) {
  if (color === 'image') return null

  return (
    <View
      style={[
        styles.imageContainer,
        styles.paletteContainer,
        {backgroundColor: color},
      ]}
    />
  )
}
function colorRenderItem({item}: ListRenderItemInfo<Color>) {
  return <ColorItem color={item} />
}

function EmojiItem({emoji}: {emoji: Emoji}) {
  return (
    <View style={[styles.imageContainer, styles.paletteContainer]}>
      <Text>{emojiItems[emoji]}</Text>
    </View>
  )
}
function emojiRenderItem({item}: ListRenderItemInfo<Emoji>) {
  return <EmojiItem emoji={item} />
}

function Items({type}: {type: 'emojis' | 'colors'}) {
  if (type === 'colors') {
    return (
      <FlatList<Color>
        style={{height: 100}}
        data={colors}
        renderItem={colorRenderItem}
        horizontal
        contentContainerStyle={styles.flatListContainer}
      />
    )
  }

  return (
    <FlatList<Emoji>
      data={emojis}
      renderItem={emojiRenderItem}
      horizontal
      contentContainerStyle={styles.flatListContainer}
    />
  )
}

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 100,
    height: 150,
    width: 250,
    overflow: 'hidden',
  },
  paletteContainer: {
    height: 90,
    width: 90,
    marginHorizontal: 5,
  },
  flatListContainer: {
    paddingLeft: 40,
    paddingRight: 40,
  },
})
