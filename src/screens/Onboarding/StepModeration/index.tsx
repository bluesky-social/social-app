import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import Animated, {Easing, Layout} from 'react-native-reanimated'

import {atoms as a} from '#/alf'
import {
  configurableAdultLabelGroups,
  configurableOtherLabelGroups,
  usePreferencesSetAdultContentMutation,
} from 'state/queries/preferences'
import {Divider} from '#/components/Divider'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {Loader} from '#/components/Loader'
import {useAnalytics} from '#/lib/analytics/analytics'

import {
  Description,
  OnboardingControls,
  Title,
} from '#/screens/Onboarding/Layout'
import {ModerationOption} from '#/screens/Onboarding/StepModeration/ModerationOption'
import {AdultContentEnabledPref} from '#/screens/Onboarding/StepModeration/AdultContentEnabledPref'
import {Context} from '#/screens/Onboarding/state'
import {IconCircle} from '#/components/IconCircle'

function AnimatedDivider() {
  return (
    <Animated.View layout={Layout.easing(Easing.ease).duration(200)}>
      <Divider />
    </Animated.View>
  )
}

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
    (!variables && preferences?.adultContentEnabled)
  )

  const onContinue = React.useCallback(() => {
    dispatch({type: 'next'})
    track('OnboardingV2:StepModeration:End')
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
            {adultContentEnabled &&
              configurableAdultLabelGroups.map((g, index) => (
                <React.Fragment key={index}>
                  {index === 0 && <AnimatedDivider />}
                  <ModerationOption labelGroup={g} isMounted={isMounted} />
                  <AnimatedDivider />
                </React.Fragment>
              ))}

            {configurableOtherLabelGroups.map((g, index) => (
              <React.Fragment key={index}>
                {!adultContentEnabled && index === 0 && <AnimatedDivider />}
                <ModerationOption labelGroup={g} isMounted={isMounted} />
                <AnimatedDivider />
              </React.Fragment>
            ))}
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
