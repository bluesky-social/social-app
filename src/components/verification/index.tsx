import {useMemo} from 'react'
import {AppBskyActorDefs, ChatBskyActorDefs, type Un$Typed} from '@atproto/api'

import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useSession} from '#/state/session'
import * as bsky from '#/types/bsky'

export type FullVerificationState = ReturnType<typeof useFullVerificationState>

export function useFullVerificationState({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}) {
  const {currentAccount} = useSession()
  const currentAccountProfile = useCurrentAccountProfile()
  return useMemo(() => {
    const profileState = getSimpleVerificationState({profile})
    const viewerState = currentAccountProfile
      ? getSimpleVerificationState({profile: currentAccountProfile})
      : undefined

    const wasValid =
      profileState.role === 'default' &&
      !profileState.isValid &&
      profileState.verifications.length > 0
    const hasIssuedVerification =
      viewerState &&
      viewerState.role === 'verifier' &&
      profileState.role === 'default' &&
      profileState.verifications.find(v => v.issuer === currentAccount?.did)

    return {
      profile: {
        ...profileState,
        isSelf: profile.did === currentAccount?.did,
        wasValid,
      },
      viewer: viewerState
        ? {
            ...viewerState,
            hasIssuedVerification,
          }
        : undefined,
    }
  }, [profile, currentAccount, currentAccountProfile])
}

export const DEFAULT_USER_STATE: AppBskyActorDefs.VerificationStateDefault = {
  role: 'default',
  isValid: false,
  verifications: [],
}

export const DEFAULT_VERIFIER_STATE: AppBskyActorDefs.VerificationStateVerifier =
  {
    role: 'verifier',
    isValid: true,
  }

export type SimpleVerificationState = ReturnType<
  typeof getSimpleVerificationState
>

export function getSimpleVerificationState({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}):
  | Un$Typed<AppBskyActorDefs.VerificationStateDefault>
  | Un$Typed<AppBskyActorDefs.VerificationStateVerifier> {
  if (
    bsky.dangerousIsType<ChatBskyActorDefs.ProfileViewBasic>(
      profile,
      ChatBskyActorDefs.isProfileViewBasic,
    )
  ) {
    return DEFAULT_USER_STATE
  }

  if (!profile.verification) {
    return DEFAULT_USER_STATE
    // return DEFAULT_VERIFIER_STATE
  }

  if (
    bsky.dangerousIsType<AppBskyActorDefs.VerificationStateDefault>(
      profile.verification,
      AppBskyActorDefs.isVerificationStateDefault,
    )
  ) {
    const {verification} = profile
    return {
      role: verification.role,
      isValid: verification.isValid,
      verifications: verification.verifications,
    }
  } else if (
    bsky.dangerousIsType<AppBskyActorDefs.VerificationStateVerifier>(
      profile.verification,
      AppBskyActorDefs.isVerificationStateVerifier,
    )
  ) {
    const {verification} = profile
    return {
      role: verification.role,
      isValid: verification.isValid,
    }
  } else {
    return DEFAULT_USER_STATE
  }
}

export function useSimpleVerificationState({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}) {
  return useMemo(() => {
    return getSimpleVerificationState({profile})
  }, [profile])
}
