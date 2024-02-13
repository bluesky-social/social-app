import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {News2_Stroke2_Corner0_Rounded as News} from '#/components/icons/News2'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
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
import {IconCircle} from '#/screens/Onboarding/IconCircle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {StreamingLive_Stroke2_Corner0_Rounded} from '#/components/icons/StreamingLive'

export function StepProfile() {
  const {_} = useLingui()
  const t = useTheme()
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const onboardDispatch = useOnboardingDispatch()

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
        <Trans>You're ready to go!</Trans>
      </Title>
      <Description>
        <Trans>We hope you have a wonderful time. Remember, Bluesky is:</Trans>
      </Description>

      <View style={[a.pt_5xl, a.gap_3xl]}>
        <View style={[a.flex_row, a.align_center, a.w_full, a.gap_lg]}>
          <IconCircle
            icon={StreamingLive}
            size="lg"
            style={{width: 48, height: 48}}
          />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Public</Trans>
            </Text>
            <Text
              style={[t.atoms.text_contrast_medium, a.text_md, a.leading_snug]}>
              <Trans>
                Your posts, likes, and blocks are public. Mutes are private.
              </Trans>
            </Text>
          </View>
        </View>
        <View style={[a.flex_row, a.align_center, a.w_full, a.gap_lg]}>
          <IconCircle icon={News} size="lg" style={{width: 48, height: 48}} />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Open</Trans>
            </Text>
            <Text
              style={[t.atoms.text_contrast_medium, a.text_md, a.leading_snug]}>
              <Trans>Never lose access to your followers or data.</Trans>
            </Text>
          </View>
        </View>
        <View style={[a.flex_row, a.align_center, a.w_full, a.gap_lg]}>
          {/*<IconCircle*/}
          {/*  icon={Trending}*/}
          {/*  size="lg"*/}
          {/*  style={{width: 48, height: 48}}*/}
          {/*/>*/}
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Flexible</Trans>
            </Text>
            <Text
              style={[t.atoms.text_contrast_medium, a.text_md, a.leading_snug]}>
              <Trans>Choose the algorithms that power your custom feeds.</Trans>
            </Text>
          </View>
        </View>
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
