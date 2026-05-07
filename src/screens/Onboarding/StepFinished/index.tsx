import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {
  type AppBskyActorDefs,
  type AppBskyActorProfile,
  type Un$Typed,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {uploadBlob} from '#/lib/api'
import {
  BLACKSKY_COMMUNITY_DID,
  BSKY_APP_ACCOUNT_DID,
  DISCOVER_SAVED_FEED,
  TIMELINE_SAVED_FEED,
  VIDEO_SAVED_FEED,
} from '#/lib/constants'
import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {logger} from '#/logger'
import {preferencesQueryKey} from '#/state/queries/preferences'
import {RQKEY as profileRQKey} from '#/state/queries/profile'
import {useAgent} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {useProgressGuideControls} from '#/state/shell/progress-guide'
import {
  OnboardingControls,
  OnboardingHeaderSlot,
} from '#/screens/Onboarding/Layout'
import {
  type OnboardingState,
  useOnboardingInternalState,
} from '#/screens/Onboarding/state'
import {bulkWriteFollows} from '#/screens/Onboarding/util'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRight} from '#/components/icons/Arrow'
import {Loader} from '#/components/Loader'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {ValuePropositionPager} from './ValuePropositionPager'

export function StepFinished() {
  const {state, dispatch} = useOnboardingInternalState()
  const ax = useAnalytics()
  const onboardDispatch = useOnboardingDispatch()
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()
  const agent = useAgent()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const {startProgressGuide} = useProgressGuideControls()

  const finishOnboarding = useCallback(async () => {
    setSaving(true)

    try {
      const {interestsStepResults, profileStepResults} = state
      const {selectedInterests} = interestsStepResults

      await Promise.all([
        bulkWriteFollows(agent, [BSKY_APP_ACCOUNT_DID, BLACKSKY_COMMUNITY_DID]),
        (async () => {
          // Interests need to get saved first, then we can write the feeds to prefs
          await agent.setInterestsPref({tags: selectedInterests})

          // Default feeds that every user should have pinned when landing in the app
          const feedsToSave: AppBskyActorDefs.SavedFeed[] = [
            {
              ...DISCOVER_SAVED_FEED,
              id: TID.nextStr(),
            },
            {
              ...TIMELINE_SAVED_FEED,
              id: TID.nextStr(),
            },
            {
              ...VIDEO_SAVED_FEED,
              id: TID.nextStr(),
            },
          ]

          await agent.overwriteSavedFeeds(feedsToSave)
        })(),
        (async () => {
          const {imageUri, imageMime} = profileStepResults
          const blobPromise =
            imageUri && imageMime
              ? uploadBlob(agent, imageUri, imageMime)
              : undefined

          await agent.upsertProfile(async existing => {
            let next: Un$Typed<AppBskyActorProfile.Record> = existing ?? {}

            if (blobPromise) {
              const res = await blobPromise
              if (res.data.blob) {
                next.avatar = res.data.blob
              }
            }

            next.displayName = ''

            if (!next.createdAt) {
              next.createdAt = new Date().toISOString()
            }
            return next
          })

          ax.metric('onboarding:finished:avatarResult', {
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
    startProgressGuide('follow-10')
    dispatch({type: 'finish'})
    onboardDispatch({type: 'finish'})
    ax.metric('onboarding:finished:nextPressed', {
      usedStarterPack: false,
      profilesFollowed: 0,
      feedsPinned: 0,
    })
  }, [
    ax,
    queryClient,
    agent,
    dispatch,
    onboardDispatch,
    state,
    requestNotificationsPermission,
    startProgressGuide,
  ])

  return (
    <ValueProposition
      finishOnboarding={finishOnboarding}
      saving={saving}
      state={state}
    />
  )
}

function ValueProposition({
  finishOnboarding,
  saving,
  state,
}: {
  finishOnboarding: () => void
  saving: boolean
  state: OnboardingState
}) {
  const [subStep, setSubStep] = useState<0 | 1 | 2>(0)
  const {_} = useLingui()
  const ax = useAnalytics()
  const {gtMobile} = useBreakpoints()

  const onPress = () => {
    if (subStep === 2) {
      finishOnboarding() // has its own metrics
    } else if (subStep === 1) {
      setSubStep(2)
      ax.metric('onboarding:valueProp:stepTwo:nextPressed', {})
    } else if (subStep === 0) {
      setSubStep(1)
      ax.metric('onboarding:valueProp:stepOne:nextPressed', {})
    }
  }

  return (
    <>
      {!gtMobile && (
        <OnboardingHeaderSlot.Portal>
          <Button
            disabled={saving}
            variant="ghost"
            color="secondary"
            size="small"
            label={_(msg`Skip introduction and start using your account`)}
            onPress={() => {
              ax.metric('onboarding:valueProp:skipPressed', {})
              finishOnboarding()
            }}
            style={[a.bg_transparent]}>
            <ButtonText>
              <Trans>Skip</Trans>
            </ButtonText>
          </Button>
        </OnboardingHeaderSlot.Portal>
      )}

      <ValuePropositionPager
        step={subStep}
        setStep={ss => setSubStep(ss)}
        avatarUri={state.profileStepResults.imageUri}
      />

      <OnboardingControls.Portal>
        <View style={gtMobile && [a.gap_md, a.flex_row]}>
          {gtMobile && (IS_WEB ? subStep !== 2 : true) && (
            <Button
              disabled={saving}
              color="secondary"
              size="large"
              label={_(msg`Skip introduction and start using your account`)}
              onPress={() => finishOnboarding()}>
              <ButtonText>
                <Trans>Skip</Trans>
              </ButtonText>
            </Button>
          )}
          <Button
            testID="onboardingFinish"
            disabled={saving}
            key={state.activeStep} // remove focus state on nav
            color="primary"
            size="large"
            label={
              subStep === 2
                ? _(msg`Complete onboarding and start using your account`)
                : _(msg`Next`)
            }
            onPress={onPress}>
            <ButtonText>
              {saving ? (
                <Trans>Finalizing</Trans>
              ) : subStep === 2 ? (
                <Trans>Let's go!</Trans>
              ) : (
                <Trans>Next</Trans>
              )}
            </ButtonText>
            {subStep === 2 && (
              <ButtonIcon icon={saving ? Loader : ArrowRight} />
            )}
          </Button>
        </View>
      </OnboardingControls.Portal>
    </>
  )
}
