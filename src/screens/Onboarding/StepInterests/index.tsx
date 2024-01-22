import React from 'react'
import {View} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useTheme, atoms as a} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'
import * as Toggle from '#/components/forms/Toggle'
import {profilesQueryKey} from '#/state/queries/profile'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {
  INTERESTS as INTEREST_OPTIONS,
  TEMP_ACCOUNT_MAPPING,
} from '#/screens/Onboarding/StepInterests/data'
import {InterestButton} from '#/screens/Onboarding/StepInterests/InterestButton'

export function StepInterests() {
  const t = useTheme()
  const query = useQueryClient()
  const {state, dispatch} = React.useContext(Context)
  const [saving, setSaving] = React.useState(false)
  const [interests, setInterests] = React.useState<string[]>([])

  const saveInterests = React.useCallback(async () => {
    setSaving(true)

    try {
      const {
        data: {accounts},
      } = {data: {accounts: interests.map(i => TEMP_ACCOUNT_MAPPING[i]).flat()}}
      const suggestedAccounts = Array.from(new Set(accounts))

      // wait max 2s for query to finish
      await Promise.race([
        await query.prefetchQuery({
          queryKey: profilesQueryKey(suggestedAccounts),
        }),
        await new Promise(y => setTimeout(y, 2000)),
      ])

      // done
      setSaving(false)
      dispatch({
        type: 'setSuggestedAccountHandles',
        suggestedAccountHandles: suggestedAccounts,
      })
      dispatch({type: 'next'})
    } catch (e: any) {
      logger.info(`onboading: error saving interests`)
      logger.error(e)
    }
  }, [interests, setSaving, dispatch, query])

  return (
    <View style={[a.align_start]}>
      <View
        style={[
          a.p_lg,
          a.mb_3xl,
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
        We'll use this to help customize your experience. Select at least 3
        interests.
      </Description>

      <View style={[a.pt_2xl]}>
        <Toggle.Group
          values={interests}
          onChange={setInterests}
          label="Select your interests">
          <View style={[a.flex_row, a.gap_md, a.flex_wrap]}>
            {INTEREST_OPTIONS.map(interest => (
              <Toggle.Item
                key={interest.name}
                name={interest.name}
                label={interest.title}>
                <InterestButton interest={interest} />
              </Toggle.Item>
            ))}
          </View>
        </Toggle.Group>
      </View>

      <OnboardingControls.Portal>
        <Button
          disabled={saving || interests.length < 3}
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
