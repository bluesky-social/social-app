import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamingLive} from '#/components/icons/StreamingLive'
import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {AvatarCreatorItems} from '#/screens/Onboarding/StepProfile/AvatarCreatorItems'
import {AvatarCircle} from '#/screens/Onboarding/StepProfile/AvatarCircle'
import {Emoji, emojiItems, AvatarColor, avatarColors} from './types'
import {
  PlaceholderCanvas,
  PlaceholderCanvasRef,
} from '#/screens/Onboarding/StepProfile/PlaceholderCanvas'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {IconCircle} from '#/components/IconCircle'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useAnalytics} from '#/lib/analytics/analytics'

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
    if (!imageUri) {
      imageUri = await canvasRef.current?.capture()
    }

    if (imageUri) {
      dispatch({
        type: 'setProfileStepResults',
        imageUri,
        imageMime: avatar.image?.mime ?? 'image/jpeg',
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
                  <AvatarCreatorItems type="emojis" />
                  <AvatarCreatorItems type="colors" />
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
