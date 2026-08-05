import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {TID} from '@atproto/common-web'
import {type Un$Typed} from '@atproto/lex'
import {type AtUriString, toDatetimeString} from '@atproto/syntax'
import {
  overwriteSavedFeeds,
  setInterestsPref,
  upsertProfile,
} from '@bsky.app/sdk'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {uploadBlob} from '#/lib/api'
import {
  BSKY_APP_ACCOUNT_DID,
  DISCOVER_SAVED_FEED,
  TIMELINE_SAVED_FEED,
  VIDEO_SAVED_FEED,
} from '#/lib/constants'
import {useRequestNotificationsPermission} from '#/lib/notifications/notifications'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {getAllListMembers} from '#/state/queries/list-members'
import {preferencesQueryKey} from '#/state/queries/preferences'
import {RQKEY as profileRQKey} from '#/state/queries/profile'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {
  useActiveStarterPack,
  useSetActiveStarterPack,
} from '#/state/shell/landing'
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
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {ValuePropositionPager} from './ValuePropositionPager'

export function StepFinished() {
  const {state, dispatch} = useOnboardingInternalState()
  const ax = useAnalytics()
  const onboardDispatch = useOnboardingDispatch()
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()
  const pdsClient = usePdsClient()
  const appviewClient = useAppviewClient()
  const requestNotificationsPermission = useRequestNotificationsPermission()
  const activeStarterPack = useActiveStarterPack()
  const setActiveStarterPack = useSetActiveStarterPack()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()
  const {startProgressGuide} = useProgressGuideControls()

  const finishOnboarding = useCallback(async () => {
    setSaving(true)

    let starterPack: app.bsky.graph.defs.StarterPackView | undefined
    let listItems: app.bsky.graph.defs.ListItemView[] | undefined

    if (activeStarterPack?.uri) {
      try {
        const spRes = await appviewClient.call(app.bsky.graph.getStarterPack, {
          starterPack: activeStarterPack.uri as AtUriString,
        })
        starterPack = spRes.starterPack
      } catch (e) {
        logger.error('Failed to fetch starter pack', {safeMessage: e})
        // don't tell the user, just get them through onboarding.
      }
      try {
        if (starterPack?.list) {
          listItems = await getAllListMembers(
            appviewClient,
            starterPack.list.uri,
          )
        }
      } catch (e) {
        logger.error('Failed to fetch starter pack list items', {
          safeMessage: e,
        })
        // don't tell the user, just get them through onboarding.
      }
    }

    try {
      const {interestsStepResults, profileStepResults} = state
      const {selectedInterests} = interestsStepResults

      await Promise.all([
        bulkWriteFollows(
          pdsClient,
          appviewClient,
          [BSKY_APP_ACCOUNT_DID, ...(listItems?.map(i => i.subject.did) ?? [])],
          starterPack
            ? {uri: starterPack.uri, cid: starterPack.cid}
            : undefined,
        ),
        (async () => {
          // Interests need to get saved first, then we can write the feeds to prefs
          await pdsClient.call(setInterestsPref, {tags: selectedInterests})

          // Default feeds that every user should have pinned when landing in the app
          const feedsToSave: app.bsky.actor.defs.SavedFeed[] = [
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

          // Any starter pack feeds will be pinned _after_ the defaults
          if (starterPack && starterPack.feeds?.length) {
            feedsToSave.push(
              ...starterPack.feeds.map(f => ({
                type: 'feed' as const,
                value: f.uri,
                pinned: true,
                id: TID.nextStr(),
              })),
            )
          }

          await pdsClient.call(overwriteSavedFeeds, feedsToSave)
        })(),
        (async () => {
          const {imageUri, imageMime} = profileStepResults
          const blobPromise =
            imageUri && imageMime
              ? uploadBlob(pdsClient, imageUri, imageMime)
              : undefined

          await pdsClient.call(upsertProfile, async existing => {
            let next: Un$Typed<app.bsky.actor.profile.Main> = existing ?? {}

            if (blobPromise) {
              const res = await blobPromise
              if (res.blob) {
                next.avatar = res.blob
              }
            }

            if (starterPack) {
              next.joinedViaStarterPack = {
                uri: starterPack.uri,
                cid: starterPack.cid,
              }
            }

            next.displayName = ''

            if (!next.createdAt) {
              next.createdAt = toDatetimeString(new Date())
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
        queryKey: profileRQKey(pdsClient.did ?? ''),
      }),
    ]).catch(e => {
      logger.error(e)
      // Keep going.
    })

    setSaving(false)
    setActiveStarterPack(undefined)
    setHasCheckedForStarterPack(true)
    startProgressGuide('follow-10')
    dispatch({type: 'finish'})
    onboardDispatch({type: 'finish'})
    ax.metric('onboarding:finished:nextPressed', {
      usedStarterPack: Boolean(starterPack),
      starterPackName:
        starterPack &&
        bsky.isType(app.bsky.graph.starterpack, starterPack.record)
          ? starterPack.record.name
          : undefined,
      starterPackCreator: starterPack?.creator.did,
      starterPackUri: starterPack?.uri,
      profilesFollowed: listItems?.length ?? 0,
      feedsPinned: starterPack?.feeds?.length ?? 0,
    })
    if (starterPack && listItems?.length) {
      ax.metric('starterPack:followAll', {
        logContext: 'Onboarding',
        starterPack: starterPack.uri,
        count: listItems?.length,
      })
    }
  }, [
    ax,
    queryClient,
    pdsClient,
    appviewClient,
    dispatch,
    onboardDispatch,
    activeStarterPack,
    state,
    requestNotificationsPermission,
    setActiveStarterPack,
    setHasCheckedForStarterPack,
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
