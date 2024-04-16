import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {DISCOVER_FEED_URI} from '#/lib/constants'
import {BSKY_APP_ACCOUNT_DID} from '#/lib/constants'
import {useGate} from '#/lib/statsig/statsig'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {useSetSaveFeedsMutation} from '#/state/queries/preferences'
import {getAgent} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {uploadBlob} from 'lib/api'
import {
  DescriptionText,
  OnboardingControls,
  TitleText,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {
  bulkWriteFollows,
  sortPrimaryAlgorithmFeeds,
} from '#/screens/Onboarding/util'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {IconCircle} from '#/components/IconCircle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Growth_Stroke2_Corner0_Rounded as Growth} from '#/components/icons/Growth'
import {News2_Stroke2_Corner0_Rounded as News} from '#/components/icons/News2'
import {Trending2_Stroke2_Corner2_Rounded as Trending} from '#/components/icons/Trending2'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function StepFinished() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const onboardDispatch = useOnboardingDispatch()
  const [saving, setSaving] = React.useState(false)
  const {mutateAsync: saveFeeds} = useSetSaveFeedsMutation()
  const isV2Enabled = useGate('reduced_onboarding_and_home_algo')

  const finishOnboarding = React.useCallback(async () => {
    setSaving(true)

    // TODO uncomment
    const {
      interestsStepResults,
      suggestedAccountsStepResults,
      algoFeedsStepResults,
      topicalFeedsStepResults,
      profileStepResults,
    } = state
    const {selectedInterests} = interestsStepResults
    const selectedFeeds = [
      ...sortPrimaryAlgorithmFeeds(algoFeedsStepResults.feedUris),
      ...topicalFeedsStepResults.feedUris,
    ]

    try {
      await Promise.all([
        bulkWriteFollows(
          suggestedAccountsStepResults.accountDids.concat(BSKY_APP_ACCOUNT_DID),
        ),
        // these must be serial
        (async () => {
          await getAgent().setInterestsPref({tags: selectedInterests})
          await saveFeeds({
            saved: selectedFeeds,
            pinned: selectedFeeds,
          })
        })(),
      ])

      await getAgent().upsertProfile(async existing => {
        existing = existing ?? {}

        if (profileStepResults.imageUri && profileStepResults.imageMime) {
          const res = await uploadBlob(
            getAgent(),
            profileStepResults.imageUri,
            profileStepResults.imageMime,
          )

          if (res.data.blob) {
            existing.avatar = res.data.blob
          }
        }

        return existing
      })

      if (isV2Enabled) {
        await getAgent().setHomeAlgoPref({
          enabled: true,
          uri: DISCOVER_FEED_URI,
        })
      }
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
    logEvent('onboarding:finished:nextPressed', {})
  }, [
    state,
    dispatch,
    onboardDispatch,
    setSaving,
    saveFeeds,
    track,
    isV2Enabled,
  ])

  React.useEffect(() => {
    track('OnboardingV2:StepFinished:Start')
  }, [track])

  return (
    <View style={[a.align_start, gtMobile ? a.px_5xl : a.px_xl]}>
      <IconCircle icon={Check} style={[a.mb_2xl]} />

      <TitleText>
        <Trans>You're ready to go!</Trans>
      </TitleText>
      <DescriptionText>
        <Trans>We hope you have a wonderful time. Remember, Bluesky is:</Trans>
      </DescriptionText>

      <View style={[a.pt_5xl, a.gap_3xl]}>
        <View style={[a.flex_row, a.align_center, a.w_full, a.gap_lg]}>
          <IconCircle icon={Growth} size="lg" style={{width: 48, height: 48}} />
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
              style={[t.atoms.text_contrast_medium, a.text_md, a.leading_snug]}>
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
