import React from 'react'
import {View} from 'react-native'
import {LABELS} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {logEvent} from '#/lib/statsig/statsig'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {usePreferencesSetAdultContentMutation} from 'state/queries/preferences'
import {
  Description,
  OnboardingControls,
  Title,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {AdultContentEnabledPref} from '#/screens/Onboarding/StepModeration/AdultContentEnabledPref'
import {ModerationOption} from '#/screens/Onboarding/StepModeration/ModerationOption'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {IconCircle} from '#/components/IconCircle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Loader} from '#/components/Loader'

export function StepModeration() {
  const {_} = useLingui()
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetAdultContentMutation()

  // We need to know if the screen is mounted so we know if we want to run entering animations
  // https://github.com/software-mansion/react-native-reanimated/discussions/2513
  const isMounted = React.useRef(false)
  React.useLayoutEffect(() => {
    isMounted.current = true
  }, [])

  const adultContentEnabled = !!(
    (variables && variables.enabled) ||
    (!variables && preferences?.moderationPrefs.adultContentEnabled)
  )

  const onContinue = React.useCallback(() => {
    dispatch({type: 'next'})
    track('OnboardingV2:StepModeration:End')
    logEvent('onboarding:moderation:nextPressed', {})
  }, [track, dispatch])

  React.useEffect(() => {
    track('OnboardingV2:StepModeration:Start')
  }, [track])

  return (
    <View style={[a.align_start]}>
      <IconCircle icon={EyeSlash} style={[a.mb_2xl]} />

      <Title>
        <Trans>You're in control</Trans>
      </Title>
      <Description style={[a.mb_xl]}>
        <Trans>
          Select what you want to see (or not see), and we’ll handle the rest.
        </Trans>
      </Description>

      {!preferences ? (
        <View style={[a.pt_md]}>
          <Loader size="xl" />
        </View>
      ) : (
        <>
          <AdultContentEnabledPref mutate={mutate} variables={variables} />

          <View style={[a.gap_sm, a.w_full]}>
            <ModerationOption
              labelValueDefinition={LABELS.porn}
              disabled={!adultContentEnabled}
            />
            <ModerationOption
              labelValueDefinition={LABELS.sexual}
              disabled={!adultContentEnabled}
            />
            <ModerationOption
              labelValueDefinition={LABELS['graphic-media']}
              disabled={!adultContentEnabled}
            />
            <ModerationOption labelValueDefinition={LABELS.nudity} />
          </View>
        </>
      )}

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
