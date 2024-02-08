import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {logger} from '#/logger'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {News2_Stroke2_Corner0_Rounded as News} from '#/components/icons/News2'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Growth_Stroke2_Corner0_Rounded as Growth} from '#/components/icons/Growth'
import {Trending2_Stroke2_Corner2_Rounded as Trending} from '#/components/icons/Trending2'
import {Text} from '#/components/Typography'
import {useOnboardingDispatch} from '#/state/shell'
import {Loader} from '#/components/Loader'
import {useSetSaveFeedsMutation} from '#/state/queries/preferences'
import {getAgent} from '#/state/session'
import {useAnalytics} from '#/lib/analytics/analytics'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {IconCircle} from '#/screens/Onboarding/IconCircle'
import {
  bulkWriteFollows,
  sortPrimaryAlgorithmFeeds,
} from '#/screens/Onboarding/util'

export function StepFinished() {
  const {_} = useLingui()
  const t = useTheme()
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const onboardDispatch = useOnboardingDispatch()
  const [saving, setSaving] = React.useState(false)
  const {mutateAsync: saveFeeds} = useSetSaveFeedsMutation()

  const finishOnboarding = React.useCallback(async () => {
    setSaving(true)

    const {
      interestsStepResults,
      suggestedAccountsStepResults,
      algoFeedsStepResults,
      topicalFeedsStepResults,
    } = state
    const {selectedInterests} = interestsStepResults
    const selectedFeeds = [
      ...sortPrimaryAlgorithmFeeds(algoFeedsStepResults.feedUris),
      ...topicalFeedsStepResults.feedUris,
    ]

    try {
      await Promise.all([
        bulkWriteFollows(suggestedAccountsStepResults.accountDids),
        // these must be serial
        (async () => {
          await getAgent().setInterestsPref({tags: selectedInterests})
          await saveFeeds({
            saved: selectedFeeds,
            pinned: selectedFeeds,
          })
        })(),
      ])
    } catch (e: any) {
      logger.info(`onboarding: bulk save failed`)
      logger.error(e)
      // don't alert the user, just let them into their account
    }

    setSaving(false)
    dispatch({type: 'finish'})
    onboardDispatch({type: 'finish'})
    track('OnboardingV2:StepFinished:End')
    track('OnboardingV2:Complete')
  }, [state, dispatch, onboardDispatch, setSaving, saveFeeds, track])

  React.useEffect(() => {
    track('OnboardingV2:StepFinished:Start')
  }, [track])

  return (
    <View style={[a.align_start]}>
      <IconCircle icon={Check} style={[a.mb_2xl]} />

      <Title>
        <Trans>You're ready to go!</Trans>
      </Title>
      <Description>
        <Trans>We hope you have a wonderful time. Remember, Bluesky is:</Trans>
      </Description>

      <View style={[a.pt_5xl, a.gap_3xl]}>
        <View style={[a.flex_row, a.align_center, a.w_full, a.gap_lg]}>
          <IconCircle icon={Growth} size="lg" style={{width: 48, height: 48}} />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Public</Trans>
            </Text>
            <Text
              style={[t.atoms.text_contrast_500, a.text_md, a.leading_snug]}>
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
              style={[t.atoms.text_contrast_500, a.text_md, a.leading_snug]}>
              <Trans>Never lose access to your followers or data.</Trans>
            </Text>
          </View>
        </View>
        <View style={[a.flex_row, a.align_center, a.w_full, a.gap_lg]}>
          <IconCircle
            icon={Trending}
            size="lg"
            style={{width: 48, height: 48}}
          />
          <View style={[a.flex_1, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Flexible</Trans>
            </Text>
            <Text
              style={[t.atoms.text_contrast_500, a.text_md, a.leading_snug]}>
              <Trans>Choose the algorithms that power your custom feeds.</Trans>
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
          label={_(msg`Complete onboarding and start using your account`)}
          onPress={finishOnboarding}>
          <ButtonText>
            {saving ? <Trans>Finalizing</Trans> : <Trans>Let's go!</Trans>}
          </ButtonText>
          {saving && <ButtonIcon icon={Loader} position="right" />}
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
