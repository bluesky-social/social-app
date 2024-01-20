import React from 'react'
import {View} from 'react-native'

import {useTheme, atoms as a} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'

import {Context} from '#/screens/Onboarding/context'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'

export function StepInterests() {
  const t = useTheme()
  const {state, dispatch} = React.useContext(Context)
  const [saving, setSaving] = React.useState(false)

  const saveInterests = React.useCallback(async () => {
    setSaving(true)
    await new Promise(y => setTimeout(y, 1000))
    setSaving(false)
    dispatch({type: 'next'})
  }, [setSaving, dispatch])

  return (
    <View style={[a.align_start]}>
      <View
        style={[
          a.p_lg,
          a.rounded_full,
          {
            backgroundColor:
              t.name === 'light' ? t.palette.primary_25 : t.palette.primary_975,
          },
        ]}>
        <At size="xl" fill={t.palette.primary_500} />
      </View>

      <Title>What are your interests?</Title>
      <Description>
        We'll use this to help customize your experience.
      </Description>

      <OnboardingControls.Portal>
        <Button
          disabled={saving}
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Continue setting up your account"
          onPress={saveInterests}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={saving ? Loader : ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
