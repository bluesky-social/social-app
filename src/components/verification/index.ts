import {useMemo} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'

import {usePreferencesQuery} from '#/state/queries/preferences'
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useMergedVerificationState} from '#/state/queries/verification/useMergedVerificationState'
import {useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'

export type FullVerificationState = {
  profile: {
    role: 'default' | 'verifier'
    isVerified: boolean
    wasVerified: boolean
    isViewer: boolean
    showBadge: boolean
  }
  viewer:
    | {
        role: 'default'
        isVerified: boolean
      }
    | {
        role: 'verifier'
        isVerified: boolean
        hasIssuedVerification: boolean
      }
  /**
   * The merged verification records (ours + Bluesky's), exposed so consumers
   * read these instead of reaching into `profile.verification` directly.
   */
  verifications: AppBskyActorDefs.VerificationView[]
}

export function useFullVerificationState({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}): FullVerificationState {
  const {currentAccount} = useSession()
  const currentAccountProfile = useCurrentAccountProfile()
  const profileState = useSimpleVerificationState({profile})
  const viewerState = useSimpleVerificationState({
    profile: currentAccountProfile,
  })
  const merged = useMergedVerificationState({profile})

  return useMemo(() => {
    const verifications = merged?.verifications || []
    const wasVerified =
      profileState.role === 'default' &&
      !profileState.isVerified &&
      verifications.length > 0
    const hasIssuedVerification = Boolean(
      viewerState &&
      viewerState.role === 'verifier' &&
      profileState.role === 'default' &&
      verifications.find(v => v.issuer === currentAccount?.did),
    )

    return {
      profile: {
        ...profileState,
        wasVerified,
        isViewer: profile.did === currentAccount?.did,
        showBadge: profileState.showBadge,
      },
      viewer:
        viewerState.role === 'verifier'
          ? {
              role: 'verifier',
              isVerified: viewerState.isVerified,
              hasIssuedVerification,
            }
          : {
              role: 'default',
              isVerified: viewerState.isVerified,
            },
      verifications,
    }
  }, [profile, currentAccount, profileState, viewerState, merged])
}

export type SimpleVerificationState = {
  role: 'default' | 'verifier'
  isVerified: boolean
  showBadge: boolean
}

export function useSimpleVerificationState({
  profile,
}: {
  profile?: bsky.profile.AnyProfileView
}): SimpleVerificationState {
  const preferences = usePreferencesQuery()
  const merged = useMergedVerificationState({profile})
  const prefs = useMemo(
    () => preferences.data?.verificationPrefs || {hideBadges: false},
    [preferences.data?.verificationPrefs],
  )
  return useMemo(() => {
    if (!profile || !merged) {
      return {
        role: 'default',
        isVerified: false,
        showBadge: false,
      }
    }

    const {verifiedStatus, trustedVerifierStatus} = merged
    const isVerifiedUser = ['valid', 'invalid'].includes(verifiedStatus)
    const isVerifierUser = ['valid', 'invalid'].includes(trustedVerifierStatus)
    const isVerified =
      (isVerifiedUser && verifiedStatus === 'valid') ||
      (isVerifierUser && trustedVerifierStatus === 'valid')

    return {
      role: isVerifierUser ? 'verifier' : 'default',
      isVerified,
      showBadge: prefs.hideBadges ? false : isVerified,
    }
  }, [profile, merged, prefs])
}
