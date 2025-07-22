import {STALE} from '#/state/queries'
import {useServiceConfigQuery} from '#/state/queries/email-verification-required'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {BSKY_SERVICE} from '../constants'
import {getHostnameFromUrl} from '../strings/url-helpers'

export function useEmail() {
  const {currentAccount} = useSession()

  const {data: serviceConfig} = useServiceConfigQuery()
  const {data: profile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: STALE.INFINITY,
  })

  const checkEmailConfirmed = !!serviceConfig?.checkEmailConfirmed

  // Date set for 11 AM PST on the 18th of November
  const isNewEnough =
    !!profile?.createdAt &&
    Date.parse(profile.createdAt) >= Date.parse('2024-11-18T19:00:00.000Z')

  const isSelfHost =
    currentAccount &&
    getHostnameFromUrl(currentAccount.service) !==
      getHostnameFromUrl(BSKY_SERVICE)

  const needsEmailVerification =
    !isSelfHost &&
    checkEmailConfirmed &&
    !currentAccount?.emailConfirmed &&
    isNewEnough

  return {needsEmailVerification}
}
