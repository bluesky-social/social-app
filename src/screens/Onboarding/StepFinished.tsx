import React from 'react'
import {View} from 'react-native'
import {TID} from '@atproto/common-web'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useAnalytics} from '#/lib/analytics/analytics'
import {BSKY_APP_ACCOUNT_DID, IS_PROD_SERVICE} from '#/lib/constants'
import {DISCOVER_SAVED_FEED, TIMELINE_SAVED_FEED} from '#/lib/constants'
import {logEvent, useGate} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {
  preferencesQueryKey,
  useOverwriteSavedFeedsMutation,
} from '#/state/queries/preferences'
import {RQKEY as profileRQKey} from '#/state/queries/profile'
import {useAgent} from '#/state/session'
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
import {atoms as a, useTheme} from '#/alf'
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
  const {track} = useAnalytics()
  const {state, dispatch} = React.useContext(Context)
  const onboardDispatch = useOnboardingDispatch()
  const [saving, setSaving] = React.useState(false)
  const {mutateAsync: overwriteSavedFeeds} = useOverwriteSavedFeedsMutation()
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()
  const gate = useGate()

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
          getAgent,
          suggestedAccountsStepResults.accountDids.concat(BSKY_APP_ACCOUNT_DID),
        ),
        // these must be serial
        (async () => {
          await getAgent().setInterestsPref({tags: selectedInterests})

          /*
           * In the reduced onboading experiment, we'll rely on the default
           * feeds set in `createAgentAndCreateAccount`. No feeds will be
           * selected in onboarding and therefore we don't need to run this
           * code (which would overwrite the other feeds already set).
           */
          if (!gate('reduced_onboarding_and_home_algo')) {
            const otherFeeds = selectedFeeds.length
              ? selectedFeeds.map(f => ({
                  type: 'feed',
                  value: f,
                  pinned: true,
                  id: TID.nextStr(),
                }))
              : []

            /*
             * If no selected feeds and we're in prod, add the discover feed
             * (mimics old behavior)
             */
            if (
              IS_PROD_SERVICE(getAgent().service.toString()) &&
              !otherFeeds.length
            ) {
              otherFeeds.push({
                ...DISCOVER_SAVED_FEED,
                pinned: true,
                id: TID.nextStr(),
              })
            }

            await overwriteSavedFeeds([
              {
                ...TIMELINE_SAVED_FEED,
                pinned: true,
                id: TID.nextStr(),
              },
              ...otherFeeds,
            ])
          }
        })(),

        (async () => {
          if (!gate('reduced_onboarding_and_home_algo')) return

          const {imageUri, imageMime} = profileStepResults
          if (imageUri && imageMime) {
            const blobPromise = uploadBlob(getAgent(), imageUri, imageMime)
            await getAgent().upsertProfile(async existing => {
              existing = existing ?? {}
              const res = await blobPromise
              if (res.data.blob) {
                existing.avatar = res.data.blob
              }
              return existing
            })
          }

          logEvent('onboarding:finished:avatarResult', {
            avatarResult: profileStepResults.isCreatedAvatar
              ? 'created'
              : profileStepResults.image
              ? 'uploaded'
              : 'default',
          })
        })(),
      ])
    } catch (e: any) {
      logger.info(`onboarding: bulk save failed`)
      logger.error(e)
      // don't alert the user, just let them into their account
    }

    // Try to ensure that prefs and profile are up-to-date by the time we render Home.
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: profileRQKey(getAgent().session?.did ?? ''),
      }),
    ]).catch(e => {
      logger.error(e)
      // Keep going.
    })

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
    overwriteSavedFeeds,
    track,
    getAgent,
    gate,
    queryClient,
  ])

  React.useEffect(() => {
    track('OnboardingV2:StepFinished:Start')
  }, [track])

  return (
    <View style={[a.align_start]}>
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
