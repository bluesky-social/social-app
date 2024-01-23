import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Text} from '#/components/Typography'
import {useOnboardingDispatch} from '#/state/shell'
import {Loader} from '#/components/Loader'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'

export function StepFinished() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)
  const onboardDispatch = useOnboardingDispatch()
  const [saving, setSaving] = React.useState(false)

  const finishOnboarding = React.useCallback(async () => {
    setSaving(true)

    console.log(state)
    await new Promise(y => setTimeout(y, 1000))

    setSaving(false)
    dispatch({type: 'finish'})
    onboardDispatch({type: 'finish'})
  }, [state, dispatch, onboardDispatch, setSaving])

  return (
    // Hack
    <View style={[a.align_start, {paddingTop: gtMobile ? 100 : 60}]}>
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
      <Description style={{maxWidth: 340}}>
        We hope you have a wonderful time. Remember, Bluesky is:
      </Description>

      <View style={[a.my_4xl, a.gap_xl]}>
        <View style={[a.flex_row, a.w_full, a.gap_lg]}>
          <AtCircle />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>Public</Text>
            <Text
              style={[t.atoms.text_contrast_500, a.text_md, a.leading_snug]}>
              Your posts, likes, and blocks are public. Mutes are private.
            </Text>
          </View>
        </View>
        <View style={[a.flex_row, a.w_full, a.gap_lg]}>
          <AtCircle />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>Open</Text>
            <Text
              style={[t.atoms.text_contrast_500, a.text_md, a.leading_snug]}>
              Never lose access to your followers and data.
            </Text>
          </View>
        </View>
        <View style={[a.flex_row, a.w_full, a.gap_lg]}>
          <AtCircle />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>Flexible</Text>
            <Text
              style={[t.atoms.text_contrast_500, a.text_md, a.leading_snug]}>
              Choose the algorithms that power your custom feeds.
            </Text>
          </View>
        </View>
      </View>

      <OnboardingControls.Portal>
        <Button
          disabled={saving}
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Continue setting up your account"
          onPress={finishOnboarding}>
          <ButtonText>
            {saving ? `Finalizing your account` : `Ready? Let's go!`}
          </ButtonText>
          {saving && <ButtonIcon icon={Loader} />}
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
