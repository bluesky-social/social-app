import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useAnalytics} from '#/lib/analytics/analytics'
import {BSKY_APP_ACCOUNT_DID} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {preferencesQueryKey} from '#/state/queries/preferences'
import {RQKEY as profileRQKey} from '#/state/queries/profile'
import {useAgent} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {uploadBlob} from 'lib/api'
import {useRequestNotificationsPermission} from 'lib/notifications/notifications'
import {
  DescriptionText,
  OnboardingControls,
  TitleText,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {bulkWriteFollows} from '#/screens/Onboarding/util'
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
  const queryClient = useQueryClient()
  const agent = useAgent()
  const requestNotificationsPermission = useRequestNotificationsPermission()

  const finishOnboarding = React.useCallback(async () => {
    setSaving(true)

    const {interestsStepResults, profileStepResults} = state
    const {selectedInterests} = interestsStepResults
    try {
      await Promise.all([
        bulkWriteFollows(agent, [BSKY_APP_ACCOUNT_DID]),
        (async () => {
          await agent.setInterestsPref({tags: selectedInterests})
        })(),
        (async () => {
          const {imageUri, imageMime} = profileStepResults
          if (imageUri && imageMime) {
            const blobPromise = uploadBlob(agent, imageUri, imageMime)
            await agent.upsertProfile(async existing => {
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
        requestNotificationsPermission('AfterOnboarding'),
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
        queryKey: profileRQKey(agent.session?.did ?? ''),
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
    queryClient,
    agent,
    dispatch,
    onboardDispatch,
    track,
    requestNotificationsPermission,
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
