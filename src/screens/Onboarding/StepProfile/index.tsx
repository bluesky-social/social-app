import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  DescriptionText,
  OnboardingControls,
  TitleText,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {IconCircle} from '#/components/IconCircle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamingLive} from '#/components/icons/StreamingLive'

export function StepProfile() {
  const {_} = useLingui()
  const {dispatch} = React.useContext(Context)

  const onContinue = React.useCallback(() => {
    dispatch({type: 'next'})
  }, [dispatch])

  return (
    <View style={[a.align_start]}>
      <IconCircle icon={StreamingLive} style={[a.mb_2xl]} />

      <TitleText>
        <Trans>Give your profile a face</Trans>
      </TitleText>
      <DescriptionText>
        <Trans>
          Help people know you're not a bot by uploading a picture or creating
          an avatar.
        </Trans>
      </DescriptionText>

      <OnboardingControls.Portal>
        <Button
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
