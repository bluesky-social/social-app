import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Text} from '#/components/Typography'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'

export function StepFinished() {
  const t = useTheme()
  const {state, dispatch} = React.useContext(Context)

  return (
    // Hack
    <View style={[a.align_start, {marginTop: -80}]}>
      {/* Placeholder */}
      <View
        style={[
          a.w_full,
          a.justify_center,
          a.align_center,
          a.mb_xl,
          {backgroundColor: t.palette.contrast_50, height: 100},
        ]}>
        <Text style={a.text_md}>Picture a happy face being here maybe :)</Text>
      </View>

      <Title>You're ready to go!</Title>
      <Description>We hope you have a wonderful time.</Description>
      <Description>Remember, Bluesky is:</Description>

      <View style={[a.my_3xl, a.gap_xl]}>
        <View style={[a.flex_row, a.w_full, a.gap_lg]}>
          <AtCircle />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>Public</Text>
            <Text style={[a.font_bold, t.atoms.text_contrast_400, a.text_md]}>
              Your posts, likes, and blocks are public. Mutes are private.
            </Text>
          </View>
        </View>
        <View style={[a.flex_row, a.w_full, a.gap_lg]}>
          <AtCircle />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>Public</Text>
            <Text style={[a.font_bold, t.atoms.text_contrast_400, a.text_md]}>
              Never lose access to your followers and data.
            </Text>
          </View>
        </View>
        <View style={[a.flex_row, a.w_full, a.gap_lg]}>
          <AtCircle />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>Public</Text>
            <Text style={[a.font_bold, t.atoms.text_contrast_400, a.text_md]}>
              Choose the algorithms that power your custom feeds.
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
          label="Continue setting up your account"
          onPress={() => dispatch({type: 'next'})}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}

function AtCircle() {
  const t = useTheme()

  return (
    <View
      style={[
        a.p_sm,
        a.mb_3xl,
        a.rounded_full,
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_25 : t.palette.primary_975,
        },
      ]}>
      <At size="xl" fill={t.palette.primary_500} />
    </View>
  )
}
